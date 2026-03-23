import Link from "next/link";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ViewToggle } from "@/components/ViewToggle";
import { InboxPage } from "@/components/InboxPage";
import { SignOutButton } from "@/components/SignOutButton";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await getServerSession(authOptions);

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
      <main className="flex-1 p-4">
        <InboxPage searchParams={searchParams} />
      </main>
    </div>
  );
}
