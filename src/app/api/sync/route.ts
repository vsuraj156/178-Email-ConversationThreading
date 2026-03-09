import { syncInbox } from "@/lib/inbox";
import { mockProvider } from "@/lib/mock-provider";

export async function POST() {
  const { conversations } = await syncInbox(mockProvider);
  return Response.json({ ok: true, conversations });
}
