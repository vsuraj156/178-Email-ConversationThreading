import type { Message, Conversation, MessageFilters } from "./types";
import type { EmailProvider } from "./provider";
import { clusterMessages } from "./clustering";

type CacheEntry = {
  messages: Message[];
  conversations: Conversation[];
  messageToConversation: Map<string, string>;
};

// Keyed by userId so each user gets their own isolated cache
const cache = new Map<string, CacheEntry>();

export async function getInboxState(
  provider: EmailProvider,
  userId: string
): Promise<CacheEntry> {
  if (cache.has(userId)) return cache.get(userId)!;
  const messages = await provider.getMessages();
  const { conversations, messageToConversation } = clusterMessages(messages);
  const entry: CacheEntry = { messages, conversations, messageToConversation };
  cache.set(userId, entry);
  return entry;
}

export function getMessagesInConversation(
  messages: Message[],
  messageToConversation: Map<string, string>,
  conversationId: string
): Message[] {
  const ids = new Set<string>();
  messageToConversation.forEach((cid, mid) => {
    if (cid === conversationId) ids.add(mid);
  });
  return messages
    .filter((m) => ids.has(m.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function syncInbox(
  provider: EmailProvider,
  userId: string
): Promise<CacheEntry> {
  cache.delete(userId);
  return getInboxState(provider, userId);
}

export function filterMessages(
  messages: Message[],
  messageToConversation: Map<string, string>,
  filters?: MessageFilters
): Message[] {
  if (!filters) return messages;
  let list = messages;
  if (filters.threadId)
    list = list.filter((m) => m.threadId === filters.threadId);
  const labelId = filters.labelId;
  if (labelId) list = list.filter((m) => m.labelIds.includes(labelId));
  if (filters.conversationId) {
    const convId = filters.conversationId;
    list = list.filter((m) => messageToConversation.get(m.id) === convId);
  }
  return list;
}
