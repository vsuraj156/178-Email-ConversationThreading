import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProvider } from "@/lib/get-provider";
import { getInboxState } from "@/lib/inbox";
import type { Message } from "@/lib/types";
import { ThreadListClient } from "./ThreadListClient";

type ChangelogEvent = {
  dateStr: string;
  label: string;
  subject: string;
  type: "new" | "reply";
};

function parseSenderName(from: string): string {
  const name = from.match(/^([^<]+)</)?.[1]?.trim();
  return name ?? from.split("@")[0];
}

function buildChangelog(messages: Message[], userEmail: string): ChangelogEvent[] {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  return sorted.map((m, i) => {
    const senderEmail =
      (m.from.match(/<([^>]+)>/) ?? m.from.match(/(\S+@\S+)/))?.[1]?.toLowerCase() ?? "";
    const isMe = senderEmail === userEmail.toLowerCase();
    return {
      dateStr: new Date(m.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      label: isMe ? "You" : parseSenderName(m.from),
      subject: m.subject,
      type: (i === 0 ? "new" : "reply") as "new" | "reply",
    };
  }).slice(-2);
}

export async function ThreadList() {
  const session = await getServerSession(authOptions);
  const userId = session?.userId ?? "mock";
  const userEmail = session?.user?.email ?? "";
  const provider = getProvider(session?.accessToken);
  const { messages } = await getInboxState(provider, userId);

  // Group messages by threadId
  const threadMap = new Map<string, Message[]>();
  for (const m of messages) {
    if (!threadMap.has(m.threadId)) threadMap.set(m.threadId, []);
    threadMap.get(m.threadId)!.push(m);
  }

  // Build thread summaries sorted by most recent message
  const threads = Array.from(threadMap.entries())
    .map(([threadId, msgs]) => {
      const sorted = [...msgs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return {
        id: threadId,
        subject: sorted[sorted.length - 1]?.subject ?? "(No subject)",
        messageCount: msgs.length,
        updatedAt: sorted[0]?.date ?? "",
        changelog: buildChangelog(msgs, userEmail),
      };
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return <ThreadListClient threads={threads} />;
}
