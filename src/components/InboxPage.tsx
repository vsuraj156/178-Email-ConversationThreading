import { ThreadList } from "./ThreadList";
import { ConversationList } from "./ConversationList";

export async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const mode = view === "threads" ? "threads" : "conversations";

  return (
    <div className="max-w-3xl mx-auto">
      {mode === "threads" ? <ThreadList /> : <ConversationList />}
    </div>
  );
}
