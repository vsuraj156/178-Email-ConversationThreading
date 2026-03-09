import type { Message, Thread, MessageFilters } from "./types";

export interface EmailProvider {
  getMessages(filters?: MessageFilters): Promise<Message[]>;
  getThreads(): Promise<Thread[]>;
  getMessage(id: string): Promise<Message | null>;
  getLabels?(): Promise<{ id: string; name: string }[]>;
}
