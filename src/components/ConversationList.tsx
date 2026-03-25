import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInboxState, getMessagesInConversation } from "@/lib/inbox";
import { getEffectiveTitle } from "@/lib/conversation-overrides";
import { getProvider } from "@/lib/get-provider";
import type { Message } from "@/lib/types";

// ─── Changelog helpers ───────────────────────────────────────────────────────

type ChangelogEvent = {
  date: Date;
  label: string;       // e.g. "JP Patil" or "You"
  subject: string;
  type: "new" | "reply" | "cross-thread";
};

function parseSenderName(from: string): string {
  const name = from.match(/^([^<]+)</)?.[1]?.trim();
  return name ?? from.split("@")[0];
}

function buildChangelog(
  messages: Message[],
  userEmail: string
): ChangelogEvent[] {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const seenThreads = new Set<string>();
  const events: ChangelogEvent[] = [];

  for (const m of sorted) {
    const senderEmail = (m.from.match(/<([^>]+)>/) ?? m.from.match(/(\S+@\S+)/))?.[1]?.toLowerCase() ?? "";
    const isMe = senderEmail === userEmail.toLowerCase();
    const label = isMe ? "You" : parseSenderName(m.from);
    const isNewThread = !seenThreads.has(m.threadId);
    seenThreads.add(m.threadId);

    let type: ChangelogEvent["type"];
    if (events.length === 0) {
      type = "new";
    } else if (isNewThread) {
      type = "cross-thread";
    } else {
      type = "reply";
    }

    events.push({ date: new Date(m.date), label, subject: m.subject, type });
  }

  return events;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const TYPE_STYLES: Record<ChangelogEvent["type"], { dot: string; text: string }> = {
  new:          { dot: "bg-blue-400",  text: "text-blue-700"  },
  reply:        { dot: "bg-gray-400",  text: "text-gray-500"  },
  "cross-thread": { dot: "bg-purple-400", text: "text-purple-700" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export async function ConversationList() {
  const session = await getServerSession(authOptions);
  const userId = session?.userId ?? "mock";
  const userEmail = session?.user?.email ?? "";
  const provider = getProvider(session?.accessToken);
  const { messages, conversations, messageToConversation } =
    await getInboxState(provider, userId);

  const enriched = conversations.map((c) => {
    const convMessages = getMessagesInConversation(
      messages,
      messageToConversation,
      c.id
    );
    return {
      ...c,
      title: getEffectiveTitle(userId, c.id, c.title),
      convMessages,
      changelog: buildChangelog(convMessages, userEmail).slice(-2),
    };
  });

  return (
    <ul className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg overflow-hidden">
      {enriched.map((c) => (
        <li key={c.id}>
          <Link
            href={`/conversations/${c.id}`}
            className="block px-4 py-3 hover:bg-gray-50 transition"
          >
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 truncate">{c.title}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                {c.threadIds?.length ?? 0} thread{(c.threadIds?.length ?? 0) === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 flex-shrink-0">
                {c.convMessages.length} msg{c.convMessages.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Changelog */}
            {c.changelog.length > 0 && (
              <ol className="mt-2 space-y-0.5">
                {c.changelog.map((ev, i) => (
                  <li key={i} className="flex items-start gap-2 min-w-0">
                    {/* Dot + connector line */}
                    <div className="flex flex-col items-center flex-shrink-0 mt-1">
                      <span
                        className={`w-2 h-2 rounded-full ${TYPE_STYLES[ev.type].dot}`}
                      />
                      {i < c.changelog.length - 1 && (
                        <span className="w-px flex-1 bg-gray-200 mt-0.5" style={{ minHeight: "10px" }} />
                      )}
                    </div>

                    {/* Event text */}
                    <span className={`text-xs leading-tight pb-1 truncate ${TYPE_STYLES[ev.type].text}`}>
                      <span className="text-gray-400 mr-1">{formatDate(ev.date)}</span>
                      <span className="font-medium">{ev.label}</span>
                      {ev.type === "reply" ? " replied" : (
                        <span className="text-gray-500 font-normal">
                          {" · "}
                          <span className="truncate">{ev.subject}</span>
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
