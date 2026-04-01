import type { Message } from "./types";

const HARVARD_BASE =
  "https://go.apis.huit.harvard.edu/ais-openai-direct-limited-schools/v1";

// Separate caches for titles and summaries
const titleCache = new Map<string, string>();
const summaryCache = new Map<string, string>();

async function callChatAPI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const res = await fetch(`${HARVARD_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.HARVARD_API_KEY!,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

function buildEmailList(messages: Message[]): string {
  return messages
    .slice(0, 8)
    .map((m, i) => `${i + 1}. From: ${m.from}\n   Subject: ${m.subject}\n   Preview: ${m.snippet.slice(0, 120)}`)
    .join("\n");
}

export async function getConversationTitle(
  conversationId: string,
  messages: Message[]
): Promise<string | null> {
  if (!process.env.HARVARD_API_KEY || messages.length < 2) return null;
  if (titleCache.has(conversationId)) return titleCache.get(conversationId)!;

  const result = await callChatAPI(
    "Generate a short, specific title (4–6 words) for a group of related emails. No punctuation at the end. No quotes. Be specific to the actual topic, not generic.",
    `What is a good title for this email conversation?\n\n${buildEmailList(messages)}`
  );

  if (result) titleCache.set(conversationId, result);
  return result;
}

export async function getConversationSummary(
  conversationId: string,
  messages: Message[]
): Promise<string | null> {
  if (!process.env.HARVARD_API_KEY || messages.length < 2) return null;
  if (summaryCache.has(conversationId)) return summaryCache.get(conversationId)!;

  const result = await callChatAPI(
    "You explain why a set of emails were grouped together. Be concise and specific — one sentence, maximum 25 words. Focus on the shared topic, person, or event. Do not start with 'These emails'.",
    `Why were these emails grouped together?\n\n${buildEmailList(messages)}`
  );

  if (result) summaryCache.set(conversationId, result);
  return result;
}

export function invalidateSummary(conversationId: string): void {
  titleCache.delete(conversationId);
  summaryCache.delete(conversationId);
}
