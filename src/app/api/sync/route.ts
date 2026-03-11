import { syncInbox } from "@/lib/inbox";
import { getProvider } from "@/lib/get-provider";

export async function POST() {
  const provider = await getProvider();
  const { conversations } = await syncInbox(provider);
  return Response.json({ ok: true, conversations });
}
