import type { EmailProvider } from "./provider";
import type { Message, MessageFilters } from "./types";
import { MOCK_MESSAGES, MOCK_THREADS } from "./mock-data";

const messagesById = new Map(MOCK_MESSAGES.map((m) => [m.id, m]));

export const mockProvider: EmailProvider = {
  async getMessages(filters?: MessageFilters): Promise<Message[]> {
    let list = [...MOCK_MESSAGES];
    if (filters?.threadId) {
      list = list.filter((m) => m.threadId === filters.threadId);
    }
    if (filters?.labelId) {
      list = list.filter((m) => m.labelIds.includes(filters.labelId!));
    }
    // conversationId filter is applied by the API layer (after clustering)
    return list;
  },

  async getThreads(): Promise<typeof MOCK_THREADS> {
    return [...MOCK_THREADS];
  },

  async getMessage(id: string): Promise<Message | null> {
    return messagesById.get(id) ?? null;
  },

  async getLabels(): Promise<{ id: string; name: string }[]> {
    return [
      { id: "INBOX", name: "Inbox" },
      { id: "Recruiter", name: "Recruiter" },
      { id: "HackerRank", name: "HackerRank" },
      { id: "Work", name: "Work" },
      { id: "Sent", name: "Sent" },
    ];
  },
};
