import type { gmail_v1 } from "googleapis";
import type { EmailProvider } from "./provider";
import type { Message, Thread, MessageFilters } from "./types";

const MAX_THREADS = 50;

function getHeader(
  headers: { name?: string | null; value?: string | null }[] | undefined,
  name: string
): string {
  if (!headers) return "";
  const h = headers.find((x) => (x.name ?? "").toLowerCase() === name.toLowerCase());
  return h?.value ?? "";
}

function parseToAddresses(toHeader: string): string[] {
  if (!toHeader.trim()) return [];
  return toHeader.split(",").map((s) => s.trim()).filter(Boolean);
}

function gmailMessageToMessage(gm: gmail_v1.Schema$Message): Message {
  const headers = gm.payload?.headers ?? [];
  const subject = getHeader(headers, "Subject");
  const from = getHeader(headers, "From");
  const to = parseToAddresses(getHeader(headers, "To"));
  const dateHeader = getHeader(headers, "Date");
  let date = dateHeader ? new Date(dateHeader).toISOString() : new Date(0).toISOString();
  if (gm.internalDate) {
    date = new Date(Number(gm.internalDate)).toISOString();
  }
  return {
    id: gm.id ?? "",
    threadId: gm.threadId ?? "",
    subject,
    snippet: gm.snippet ?? "",
    from,
    to,
    date,
    labelIds: gm.labelIds ?? [],
  };
}

function extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return "";
  if (payload.body?.data) {
    try {
      return Buffer.from(payload.body.data, "base64").toString("utf-8");
    } catch {
      return "";
    }
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        try {
          return Buffer.from(part.body.data, "base64").toString("utf-8");
        } catch {
          // continue
        }
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        try {
          return Buffer.from(part.body.data, "base64").toString("utf-8");
        } catch {
          // continue
        }
      }
    }
  }
  return "";
}

export function createGmailProvider(gmail: gmail_v1.Gmail): EmailProvider {
  return {
    async getMessages(filters?: MessageFilters): Promise<Message[]> {
      if (filters?.threadId) {
        const res = await gmail.users.threads.get({
          userId: "me",
          id: filters.threadId,
          format: "metadata",
          metadataHeaders: ["From", "To", "Subject", "Date"],
        });
        const messages = res.data.messages ?? [];
        return messages.map((gm) => gmailMessageToMessage(gm));
      }

      const listRes = await gmail.users.threads.list({
        userId: "me",
        maxResults: MAX_THREADS,
        q: filters?.labelId ? `label:${filters.labelId}` : undefined,
      });
      const threadIds = (listRes.data.threads ?? []).map((t) => t.id!);
      const allMessages: Message[] = [];

      for (const threadId of threadIds) {
        const threadRes = await gmail.users.threads.get({
          userId: "me",
          id: threadId,
          format: "metadata",
          metadataHeaders: ["From", "To", "Subject", "Date"],
        });
        const threadMessages = threadRes.data.messages ?? [];
        for (const gm of threadMessages) {
          allMessages.push(gmailMessageToMessage(gm));
        }
      }

      if (filters?.labelId) {
        return allMessages.filter((m) => m.labelIds.includes(filters!.labelId!));
      }
      return allMessages;
    },

    async getThreads(): Promise<Thread[]> {
      const listRes = await gmail.users.threads.list({
        userId: "me",
        maxResults: MAX_THREADS,
      });
      const threadIds = (listRes.data.threads ?? []).map((t) => t.id!);
      const threads: Thread[] = [];

      for (const threadId of threadIds) {
        const threadRes = await gmail.users.threads.get({
          userId: "me",
          id: threadId,
          format: "metadata",
          metadataHeaders: ["Subject", "Date"],
        });
        const messages = threadRes.data.messages ?? [];
        const messageIds = messages.map((m) => m.id!);
        const first = messages[0];
        const headers = first?.payload?.headers ?? [];
        const subject = getHeader(headers, "Subject");
        const internalDate = first?.internalDate ? Number(first.internalDate) : 0;
        threads.push({
          id: threadId,
          subject: subject || "(No subject)",
          messageIds,
          snippet: first?.snippet ?? "",
          updatedAt: new Date(internalDate).toISOString(),
        });
      }

      return threads.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    },

    async getMessage(id: string): Promise<Message | null> {
      try {
        const res = await gmail.users.messages.get({
          userId: "me",
          id,
          format: "full",
        });
        const gm = res.data;
        const msg = gmailMessageToMessage(gm);
        msg.body = extractBody(gm.payload);
        return msg;
      } catch {
        return null;
      }
    },

    async getLabels(): Promise<{ id: string; name: string }[]> {
      const res = await gmail.users.labels.list({ userId: "me" });
      return (res.data.labels ?? []).map((l) => ({
        id: l.id ?? "",
        name: l.name ?? l.id ?? "",
      }));
    },
  };
}
