import type { Message, Conversation } from "./types";

const SIMILARITY_THRESHOLD = 0.18; // enough shared tokens to merge (e.g. "acme" + "assessment" + "coding")

function getTextForEmbedding(m: Message): string {
  return `${m.subject} ${m.snippet} ${m.from}`.toLowerCase();
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1)
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

export function clusterMessages(messages: Message[]): {
  conversations: Conversation[];
  messageToConversation: Map<string, string>;
} {
  const messageToConversation = new Map<string, string>();
  if (messages.length === 0) {
    return { conversations: [], messageToConversation };
  }

  const tokens = messages.map((m) => tokenize(getTextForEmbedding(m)));
  const roots = unionFindMerge(messages.length, (i, j) => {
    return jaccard(tokens[i], tokens[j]) >= SIMILARITY_THRESHOLD;
  });

  const rootToMessages = new Map<number, Message[]>();
  messages.forEach((m, i) => {
    const r = roots[i];
    if (!rootToMessages.has(r)) rootToMessages.set(r, []);
    rootToMessages.get(r)!.push(m);
  });

  const conversations: Conversation[] = [];
  const rootToId = new Map<number, string>();
  let convIndex = 0;

  rootToMessages.forEach((msgs, root) => {
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const conversationId = `conv-${++convIndex}`;
    rootToId.set(root, conversationId);
    const messageIds = sorted.map((m) => m.id);
    const threadIds = Array.from(new Set(msgs.map((m) => m.threadId)));
    const updatedAt = sorted[sorted.length - 1]?.date ?? new Date().toISOString();
    const title =
      sorted[0]?.subject ?? `Conversation ${convIndex}`;
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
