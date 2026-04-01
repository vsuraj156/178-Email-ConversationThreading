import type { Message, Conversation, MessageFilters } from "./types";
import type { EmailProvider } from "./provider";
import { clusterMessages } from "./clustering";
import { getMessageOverrides } from "./manual-overrides";

// Messages are expensive (many Gmail API calls) — cache separately
const messageCache = new Map<string, Message[]>();

// Conversations are cheap to recompute — invalidated on merge/split without
// re-fetching messages
const conversationCache = new Map<string, {
  conversations: Conversation[];
  messageToConversation: Map<string, string>;
}>();

function rebuildFromAssignments(
  messages: Message[],
  messageToConversation: Map<string, string>,
  titleFallbacks: Map<string, string>
): Conversation[] {
  const groups = new Map<string, Message[]>();
  for (const m of messages) {
    const cid = messageToConversation.get(m.id);
    if (!cid) continue;
    if (!groups.has(cid)) groups.set(cid, []);
    groups.get(cid)!.push(m);
  }

  const conversations: Conversation[] = [];
  groups.forEach((msgs, cid) => {
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    conversations.push({
      id: cid,
      title: titleFallbacks.get(cid) ?? sorted[0]?.subject ?? cid,
      messageIds: sorted.map((m) => m.id),
      threadIds: Array.from(new Set(msgs.map((m) => m.threadId))),
      updatedAt: sorted[sorted.length - 1]?.date ?? new Date().toISOString(),
    });
  });

  return conversations.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

async function buildConversationCache(userId: string, messages: Message[]) {
  const { conversations, messageToConversation } = await clusterMessages(messages);

  const overrides = getMessageOverrides(userId);
  if (overrides.size > 0) {
    overrides.forEach((convId, msgId) => {
      messageToConversation.set(msgId, convId);
    });
    const titleFallbacks = new Map(conversations.map((c) => [c.id, c.title]));
    const rebuilt = rebuildFromAssignments(messages, messageToConversation, titleFallbacks);
    conversationCache.set(userId, { conversations: rebuilt, messageToConversation });
  } else {
    conversationCache.set(userId, { conversations, messageToConversation });
  }
}

export async function getInboxState(
  provider: EmailProvider,
  userId: string
): Promise<{
  messages: Message[];
  conversations: Conversation[];
  messageToConversation: Map<string, string>;
}> {
  if (!messageCache.has(userId)) {
    let messages = await provider.getMessages();
    const freezeDate = process.env.FREEZE_DATE ? new Date(process.env.FREEZE_DATE) : null;
    if (freezeDate) {
      messages = messages.filter((m) => new Date(m.date) <= freezeDate);
    }
    messageCache.set(userId, messages);
  }
  const messages = messageCache.get(userId)!;

  if (!conversationCache.has(userId)) {
    await buildConversationCache(userId, messages);
  }
  const { conversations, messageToConversation } = conversationCache.get(userId)!;

  return { messages, conversations, messageToConversation };
}

/** Invalidates only the conversation cache — no re-fetch from Gmail. */
export async function invalidateConversations(userId: string): Promise<void> {
  conversationCache.delete(userId);
  const messages = messageCache.get(userId);
  if (messages) await buildConversationCache(userId, messages);
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
): Promise<{
  messages: Message[];
  conversations: Conversation[];
  messageToConversation: Map<string, string>;
}> {
  messageCache.delete(userId);
  conversationCache.delete(userId);
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
