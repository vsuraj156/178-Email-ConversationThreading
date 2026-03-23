import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncInbox } from "@/lib/inbox";
import { getProvider } from "@/lib/get-provider";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.userId ?? "mock";
  const provider = getProvider(session?.accessToken);
  const { conversations } = await syncInbox(provider, userId);
  return Response.json({ ok: true, conversations });
}
