import Link from "next/link";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ViewToggle } from "@/components/ViewToggle";
import { getInboxState, getMessagesInConversation } from "@/lib/inbox";
import { getEffectiveTitle } from "@/lib/conversation-overrides";
import { getProvider } from "@/lib/get-provider";
import { ConversationTitleEdit } from "@/components/ConversationTitleEdit";
import { SignOutButton } from "@/components/SignOutButton";

async function getConversation(conversationId: string, accessToken: string, userId: string) {
  const provider = getProvider(accessToken);
  const { messages, conversations, messageToConversation } =
    await getInboxState(provider, userId);
  const conversation = conversations.find((c) => c.id === conversationId);
  if (!conversation) return null;
  const conversationMessages = getMessagesInConversation(
    messages,
    messageToConversation,
    conversationId
  );
  return {
    ...conversation,
    title: getEffectiveTitle(userId, conversationId, conversation.title),
    messages: conversationMessages,
  };
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const session = await getServerSession(authOptions);
  const conversation = await getConversation(
    conversationId,
    session?.accessToken ?? "",
    session?.userId ?? "mock"
  );

  if (!conversation) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <p className="text-gray-500">Conversation not found.</p>
        <Link href="/" className="text-blue-600 underline mt-2 inline-block">
          Back to Inbox
        </Link>
      </div>
    );
  }

  const messages = conversation.messages ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          Inbox
        </Link>
        <div className="flex items-center gap-4">
          {session?.user?.email && (
            <span className="text-sm text-gray-500">{session.user.email}</span>
          )}
          <Suspense fallback={<div className="w-32 h-9 bg-gray-100 rounded" />}>
            <ViewToggle />
          </Suspense>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-4 max-w-3xl mx-auto w-full">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Inbox
        </Link>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <ConversationTitleEdit
            conversationId={conversationId}
            initialTitle={conversation.title}
          />
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {conversation.threadIds?.length ?? 0} thread
            {(conversation.threadIds?.length ?? 0) === 1 ? "" : "s"}
          </span>
        </div>
        <ul className="space-y-4">
          {messages.map(
            (m: {
              id: string;
              from: string;
              date: string;
              subject: string;
              snippet: string;
              body?: string;
              threadId: string;
              labelIds: string[];
            }) => (
              <li
                key={m.id}
                className="border border-gray-200 rounded-lg p-4 bg-white"
              >
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>{m.from}</span>
                  <span>{new Date(m.date).toLocaleString()}</span>
                </div>
                <div className="font-medium text-gray-900">{m.subject}</div>
                <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                  <span>From thread: {m.threadId}</span>
                  {m.labelIds?.length > 0 && (
                    <span>Labels: {m.labelIds.join(", ")}</span>
                  )}
                </div>
                <div className="text-gray-600 mt-2">
                  {m.body ?? m.snippet}
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {m.labelIds?.map((l: string) => (
                    <span
                      key={l}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {l}
                    </span>
                  ))}
                </div>
                <a
                  href={`https://mail.google.com/mail/u/0/#inbox/${m.threadId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs text-blue-600 hover:underline inline-block"
                >
                  Open in Gmail
                </a>
              </li>
            )
          )}
        </ul>
      </main>
    </div>
  );
}
