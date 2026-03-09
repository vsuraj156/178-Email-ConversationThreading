import Link from "next/link";
import { Suspense } from "react";
import { ViewToggle } from "@/components/ViewToggle";
import { InboxPage } from "@/components/InboxPage";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          Inbox
        </Link>
        <Suspense fallback={<div className="w-32 h-9 bg-gray-100 rounded" />}>
          <ViewToggle />
        </Suspense>
      </header>
      <main className="flex-1 p-4">
        <InboxPage searchParams={searchParams} />
      </main>
    </div>
  );
}
