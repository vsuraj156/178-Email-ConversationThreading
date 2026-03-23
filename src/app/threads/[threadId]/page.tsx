import Link from "next/link";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ViewToggle } from "@/components/ViewToggle";
import { getProvider } from "@/lib/get-provider";
import { SignOutButton } from "@/components/SignOutButton";

async function getThread(threadId: string, accessToken: string) {
  const provider = getProvider(accessToken);
  const [threads, messages] = await Promise.all([
    provider.getThreads(),
    provider.getMessages({ threadId }),
  ]);
  const thread = threads.find((t) => t.id === threadId) ?? null;
  return { thread, messages };
}

export default async function ThreadDetailPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const session = await getServerSession(authOptions);
  const { thread, messages } = await getThread(threadId, session?.accessToken ?? "");

  if (!thread) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <p className="text-gray-500">Thread not found.</p>
        <Link href="/" className="text-blue-600 underline mt-2 inline-block">
          Back to Inbox
        </Link>
      </div>
    );
  }

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
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
      <main className="flex-1 p-4 max-w-3xl mx-auto w-full">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Inbox
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 mb-4">{thread.subject}</h1>
        <ul className="space-y-4">
          {sortedMessages.map((m: { id: string; from: string; date: string; subject: string; snippet: string; body?: string; labelIds: string[] }) => (
            <li
              key={m.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>{m.from}</span>
                <span>{new Date(m.date).toLocaleString()}</span>
              </div>
              <div className="font-medium text-gray-900">{m.subject}</div>
              <div className="text-gray-600 mt-2">
                {m.body ?? m.snippet}
              </div>
              {m.labelIds?.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {m.labelIds.map((l: string) => (
                    <span
                      key={l}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
