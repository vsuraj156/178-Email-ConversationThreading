"use client";

import Link from "next/link";

type ChangelogEvent = {
  dateStr: string;
  label: string;
  subject: string;
  type: "new" | "reply";
};

type ThreadSummary = {
  id: string;
  subject: string;
  messageCount: number;
  updatedAt: string;
  changelog: ChangelogEvent[];
};

const DOT: Record<ChangelogEvent["type"], string> = {
  new: "bg-blue-400",
  reply: "bg-gray-400",
};
const TEXT: Record<ChangelogEvent["type"], string> = {
  new: "text-blue-700",
  reply: "text-gray-500",
};

export function ThreadListClient({ threads }: { threads: ThreadSummary[] }) {
  return (
    <ul className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg overflow-hidden">
      {threads.map((t) => (
        <li key={t.id}>
          <Link
            href={`/threads/${t.id}`}
            className="block px-4 py-3 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 truncate">{t.subject}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 flex-shrink-0">
                {t.messageCount} msg{t.messageCount === 1 ? "" : "s"}
              </span>
            </div>

            {t.changelog.length > 0 && (
              <ol className="mt-2 space-y-0.5">
                {t.changelog.map((ev, i) => (
                  <li key={i} className="flex items-start gap-2 min-w-0">
                    <div className="flex flex-col items-center flex-shrink-0 mt-1">
                      <span className={`w-2 h-2 rounded-full ${DOT[ev.type]}`} />
                      {i < t.changelog.length - 1 && (
                        <span
                          className="w-px flex-1 bg-gray-200 mt-0.5"
                          style={{ minHeight: "10px" }}
                        />
                      )}
                    </div>
                    <span className={`text-xs leading-tight pb-1 truncate ${TEXT[ev.type]}`}>
                      <span className="text-gray-400 mr-1">{ev.dateStr}</span>
                      <span className="font-medium">{ev.label}</span>
                      {ev.type === "reply" ? (
                        " replied"
                      ) : (
                        <span className="text-gray-500 font-normal">
                          {" · "}
                          {ev.subject}
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
