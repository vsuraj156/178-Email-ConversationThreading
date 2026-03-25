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
import { ConversationGrid } from "@/components/ConversationGrid";

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

  // Assign a distinct color to each unique threadId
  const THREAD_COLORS = [
    "#3b82f6", // blue
    "#22c55e", // green
    "#f97316", // orange
    "#a855f7", // purple
    "#ec4899", // pink
    "#14b8a6", // teal
    "#eab308", // yellow
    "#ef4444", // red
  ];
  const threadIds = conversation.threadIds ?? [];
  const threadColor = new Map(
    threadIds.map((id, i) => [id, THREAD_COLORS[i % THREAD_COLORS.length]])
  );

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
      <main className="flex-1 p-4 max-w-6xl mx-auto w-full">
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
        {threadIds.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {threadIds.map((tid) => (
              <span
                key={tid}
                className="flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded px-2 py-1"
              >
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: threadColor.get(tid) }}
                />
                Thread: {tid.slice(-6)}
              </span>
            ))}
          </div>
        )}
        <ConversationGrid
          initialMessages={messages}
          threadColor={Object.fromEntries(threadColor)}
          conversationId={conversationId}
        />
      </main>
    </div>
  );
}
