import type { Message, Conversation, MessageFilters } from "./types";
import type { EmailProvider } from "./provider";
import { clusterMessages } from "./clustering";

let cached: {
  messages: Message[];
  conversations: Conversation[];
  messageToConversation: Map<string, string>;
} | null = null;

export async function getInboxState(provider: EmailProvider): Promise<{
  messages: Message[];
  conversations: Conversation[];
  messageToConversation: Map<string, string>;
}> {
  if (cached) return cached;
  const messages = await provider.getMessages();
  const { conversations, messageToConversation } = clusterMessages(messages);
  cached = { messages, conversations, messageToConversation };
  return cached;
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

export async function syncInbox(provider: EmailProvider): Promise<{
  messages: Message[];
  conversations: Conversation[];
  messageToConversation: Map<string, string>;
}> {
  cached = null;
  return getInboxState(provider);
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
  if (labelId)
    list = list.filter((m) => m.labelIds.includes(labelId));
  if (filters.conversationId) {
    const convId = filters.conversationId;
    list = list.filter((m) => messageToConversation.get(m.id) === convId);
  }
  return list;
}
