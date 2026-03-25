"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ChangelogEvent = {
  dateStr: string;
  label: string;
  subject: string;
  type: "new" | "reply" | "cross-thread";
};

type ConversationSummary = {
  id: string;
  title: string;
  threadCount: number;
  messageCount: number;
  changelog: ChangelogEvent[];
};

const DOT: Record<ChangelogEvent["type"], string> = {
  new: "bg-blue-400",
  reply: "bg-gray-400",
  "cross-thread": "bg-purple-400",
};
const TEXT: Record<ChangelogEvent["type"], string> = {
  new: "text-blue-700",
  reply: "text-gray-500",
  "cross-thread": "text-purple-700",
};

export function ConversationListClient({
  conversations,
}: {
  conversations: ConversationSummary[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleMerge() {
    const ids = Array.from(selected);
    if (ids.length < 2) return;
    const [targetId, ...sourceIds] = ids;
    await fetch("/api/conversations/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceIds, targetId }),
    });
    setSelected(new Set());
    startTransition(() => router.refresh());
  }

  return (
    <div className="relative">
      {/* Merge action bar */}
      {selected.size >= 2 && (
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-3">
          <span className="text-sm text-blue-700 font-medium">
            {selected.size} conversations selected
          </span>
          <button
            onClick={handleMerge}
            disabled={isPending}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Merging…" : "Merge into first selected"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            Cancel
          </button>
        </div>
      )}

      <ul className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg overflow-hidden">
        {conversations.map((c) => (
          <li key={c.id} className="flex items-stretch">
            {/* Checkbox column */}
            <label className="flex items-center px-3 cursor-pointer hover:bg-gray-50 flex-shrink-0">
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggle(c.id)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </label>

            {/* Row content */}
            <Link
              href={`/conversations/${c.id}`}
              className="flex-1 block px-4 py-3 hover:bg-gray-50 transition min-w-0"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 truncate">{c.title}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                  {c.threadCount} thread{c.threadCount === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 flex-shrink-0">
                  {c.messageCount} msg{c.messageCount === 1 ? "" : "s"}
                </span>
              </div>

              {c.changelog.length > 0 && (
                <ol className="mt-2 space-y-0.5">
                  {c.changelog.map((ev, i) => (
                    <li key={i} className="flex items-start gap-2 min-w-0">
                      <div className="flex flex-col items-center flex-shrink-0 mt-1">
                        <span className={`w-2 h-2 rounded-full ${DOT[ev.type]}`} />
                        {i < c.changelog.length - 1 && (
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
    </div>
  );
}
