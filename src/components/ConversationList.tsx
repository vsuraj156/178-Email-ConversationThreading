import Link from "next/link";
import { getInboxState, getMessagesInConversation } from "@/lib/inbox";
import { getEffectiveTitle } from "@/lib/conversation-overrides";
import { mockProvider } from "@/lib/mock-provider";

export async function ConversationList() {
  const { messages, conversations, messageToConversation } =
    await getInboxState(mockProvider);
  const enriched = conversations.map((c) => {
    const convMessages = getMessagesInConversation(
      messages,
      messageToConversation,
      c.id
    );
    const latest = convMessages[convMessages.length - 1];
    return {
      ...c,
      title: getEffectiveTitle(c.id, c.title),
      snippet: latest?.snippet ?? "",
    };
  });

  return (
    <ul className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg overflow-hidden">
      {enriched.map(
        (c: {
          id: string;
          title: string;
          messageIds: string[];
          threadIds: string[];
          updatedAt: string;
          snippet?: string;
        }) => (
          <li key={c.id}>
            <Link
              href={`/conversations/${c.id}`}
              className="block px-4 py-3 hover:bg-gray-50 transition"
            >
              <div className="font-medium text-gray-900 truncate">{c.title}</div>
              <div className="text-sm text-gray-500 truncate mt-0.5">
                {c.messageIds?.length ?? 0} message
                {(c.messageIds?.length ?? 0) === 1 ? "" : "s"}
              </div>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {(c.threadIds?.length ?? 0)} thread{(c.threadIds?.length ?? 0) === 1 ? "" : "s"}
                </span>
              </div>
            </Link>
          </li>
        )
      )}
    </ul>
  );
}
