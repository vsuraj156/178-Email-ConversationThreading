import type { Message, Conversation } from "./types";
import { getEmbeddings, cosineSimilarity } from "./embeddings";

// Combined score threshold (cosine similarity + entity bonuses).
// Lower than a pure cosine threshold to allow entity signals to bridge
// semantically-different-but-related emails (e.g. outreach → calendar invite).
const COMBINED_THRESHOLD = 0.75;

// Fallback Jaccard threshold (used when HARVARD_API_KEY is not set)
const JACCARD_THRESHOLD = 0.2;

// Common English + email-specific stop words to filter before Jaccard
const STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "her",
  "was", "one", "our", "out", "day", "get", "has", "him", "his", "how",
  "its", "let", "may", "new", "now", "old", "own", "see", "two", "way",
  "who", "boy", "did", "she", "use", "your", "from", "they", "this",
  "that", "with", "have", "been", "will", "would", "there", "their",
  "what", "about", "which", "when", "make", "like", "time", "just",
  "know", "take", "into", "year", "good", "some", "could", "them",
  "then", "than", "look", "also", "back", "after", "over", "think",
  "even", "well", "want", "here", "give", "most", "more", "very",
  // email-specific
  "hi", "hey", "dear", "hello", "regards", "thanks", "thank", "please",
  "mailto", "http", "https", "www", "com", "org", "net", "edu",
  "re", "fwd", "fw", "unsubscribe", "click", "view", "email", "sent",
  "message", "mail", "inbox", "reply", "below", "above", "attached",
]);

function parseSenderEmail(from: string): string {
  return (from.match(/<([^>]+)>/) ?? from.match(/(\S+@\S+)/))?.[1]?.toLowerCase() ?? from.toLowerCase();
}

function parseSenderDomain(from: string): string {
  return parseSenderEmail(from).split("@")[1] ?? "";
}

function daysBetween(a: Message, b: Message): number {
  return (
    Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime()) /
    (1000 * 60 * 60 * 24)
  );
}

/**
 * Adds bonuses to cosine similarity based on shared sender identity and time
 * proximity. This allows semantically-different-but-related emails (e.g. a
 * job outreach and its calendar booking confirmation) to cluster correctly.
 */
function hybridScore(cosine: number, a: Message, b: Message): number {
  let bonus = 0;

  const emailA = parseSenderEmail(a.from);
  const emailB = parseSenderEmail(b.from);
  const domainA = parseSenderDomain(a.from);
  const domainB = parseSenderDomain(b.from);

  if (emailA === emailB) {
    bonus += 0.18; // same exact sender — strong signal
  } else if (
    domainA === domainB &&
    domainA &&
    domainA !== "gmail.com" &&
    domainA !== "googlemail.com"
  ) {
    bonus += 0.08; // same organisation, different person
  }

  const days = daysBetween(a, b);
  if (days <= 1) bonus += 0.10;
  else if (days <= 3) bonus += 0.06;
  else if (days <= 7) bonus += 0.03;

  return cosine + bonus;
}

function getTextForEmbedding(m: Message): string {
  // Weight subject 2x by repeating it — it's the densest signal
  const senderDomain = m.from.match(/@([\w.-]+)/)?.[1] ?? "";
  return `Subject: ${m.subject}\nSubject: ${m.subject}\nSnippet: ${m.snippet}\nSender domain: ${senderDomain}`.trim();
}

function getTokensForJaccard(m: Message): Set<string> {
  const text = `${m.subject} ${m.subject} ${m.snippet} ${m.from}`
    .toLowerCase()
    .replace(/[^\w\s]/g, " ");
  return new Set(
    text
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const inter = Array.from(a).filter((x) => b.has(x)).length;
  const union = new Set([...Array.from(a), ...Array.from(b)]).size;
  return union === 0 ? 0 : inter / union;
}

function unionFindMerge(
  n: number,
  shouldMerge: (i: number, j: number) => boolean
): number[] {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i: number): number =>
    parent[i] === i ? i : (parent[i] = find(parent[i]));
  const union = (i: number, j: number) => {
    const pi = find(i);
    const pj = find(j);
    if (pi !== pj) parent[pi] = pj;
  };
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      if (shouldMerge(i, j)) union(i, j);
  return parent.map((_, i) => find(i));
}

function buildConversations(
  messages: Message[],
  roots: number[]
): {
  conversations: Conversation[];
  messageToConversation: Map<string, string>;
} {
  const messageToConversation = new Map<string, string>();
  const rootToMessages = new Map<number, Message[]>();

  messages.forEach((m, i) => {
    const r = roots[i];
    if (!rootToMessages.has(r)) rootToMessages.set(r, []);
    rootToMessages.get(r)!.push(m);
  });

  const conversations: Conversation[] = [];
  let convIndex = 0;

  rootToMessages.forEach((msgs) => {
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const conversationId = `conv-${++convIndex}`;
    const messageIds = sorted.map((m) => m.id);
    const threadIds = Array.from(new Set(msgs.map((m) => m.threadId)));
    const updatedAt =
      sorted[sorted.length - 1]?.date ?? new Date().toISOString();
    const title = sorted[0]?.subject ?? `Conversation ${convIndex}`;
    conversations.push({
      id: conversationId,
      title,
      messageIds,
      threadIds,
      updatedAt,
    });
    msgs.forEach((m) => messageToConversation.set(m.id, conversationId));
  });

  return {
    conversations: conversations.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ),
    messageToConversation,
  };
}

export async function clusterMessages(messages: Message[]): Promise<{
  conversations: Conversation[];
  messageToConversation: Map<string, string>;
}> {
  if (messages.length === 0) {
    return { conversations: [], messageToConversation: new Map() };
  }

  // Try embedding-based clustering first
  if (process.env.HARVARD_API_KEY) {
    try {
      const texts = messages.map(getTextForEmbedding);
      const embeddings = await getEmbeddings(texts);
      const roots = unionFindMerge(messages.length, (i, j) => {
        const cosine = cosineSimilarity(embeddings[i], embeddings[j]);
        return hybridScore(cosine, messages[i], messages[j]) >= COMBINED_THRESHOLD;
      });
      return buildConversations(messages, roots);
    } catch (err) {
      console.warn("Embedding-based clustering failed, falling back to Jaccard:", err);
    }
  }

  // Fallback: improved Jaccard with stop word filtering
  const tokens = messages.map(getTokensForJaccard);
  const roots = unionFindMerge(messages.length, (i, j) => {
    return jaccard(tokens[i], tokens[j]) >= JACCARD_THRESHOLD;
  });
  return buildConversations(messages, roots);
}
