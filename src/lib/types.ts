export interface Message {
  id: string;
  threadId: string;
  subject: string;
  snippet: string;
  body?: string;
  from: string;
  to: string[];
  date: string; // ISO
  labelIds: string[];
}

export interface Thread {
  id: string;
  subject: string;
  messageIds: string[];
  snippet: string;
  updatedAt: string; // ISO
}

export interface Conversation {
  id: string;
  title: string;
  messageIds: string[];
  threadIds: string[];
  updatedAt: string;
}

export interface MessageFilters {
  threadId?: string;
  labelId?: string;
  conversationId?: string;
}
