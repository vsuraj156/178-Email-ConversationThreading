import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInboxState, getMessagesInConversation } from "@/lib/inbox";
import { getEffectiveTitle } from "@/lib/conversation-overrides";
import { getProvider } from "@/lib/get-provider";
import type { Message } from "@/lib/types";
import { ConversationListClient } from "./ConversationListClient";

// ─── Changelog helpers (same as before) ─────────────────────────────────────

type ChangelogEvent = {
  dateStr: string;
  label: string;
  subject: string;
  type: "new" | "reply" | "cross-thread";
};

function parseSenderName(from: string): string {
  const name = from.match(/^([^<]+)</)?.[1]?.trim();
  return name ?? from.split("@")[0];
}

function buildChangelog(messages: Message[], userEmail: string): ChangelogEvent[] {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const seenThreads = new Set<string>();
  const events: ChangelogEvent[] = [];

  for (const m of sorted) {
    const senderEmail =
      (m.from.match(/<([^>]+)>/) ?? m.from.match(/(\S+@\S+)/))?.[1]?.toLowerCase() ?? "";
    const isMe = senderEmail === userEmail.toLowerCase();
    const label = isMe ? "You" : parseSenderName(m.from);
    const isNewThread = !seenThreads.has(m.threadId);
    seenThreads.add(m.threadId);

    let type: ChangelogEvent["type"];
    if (events.length === 0) type = "new";
    else if (isNewThread) type = "cross-thread";
    else type = "reply";

    events.push({
      dateStr: new Date(m.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      label,
      subject: m.subject,
      type,
    });
  }

  return events.slice(-2);
}

// ─── Server component ────────────────────────────────────────────────────────

export async function ConversationList() {
  const session = await getServerSession(authOptions);
  const userId = session?.userId ?? "mock";
  const userEmail = session?.user?.email ?? "";
  const provider = getProvider(session?.accessToken);
  const { messages, conversations, messageToConversation } =
    await getInboxState(provider, userId);

  const enriched = conversations
    .filter((c) => (c.threadIds?.length ?? 0) > 1)
    .map((c) => {
      const convMessages = getMessagesInConversation(messages, messageToConversation, c.id);
      return {
        id: c.id,
        title: getEffectiveTitle(userId, c.id, c.title),
        threadCount: c.threadIds?.length ?? 0,
        messageCount: convMessages.length,
        changelog: buildChangelog(convMessages, userEmail),
      };
    });

  return <ConversationListClient conversations={enriched} />;
}
