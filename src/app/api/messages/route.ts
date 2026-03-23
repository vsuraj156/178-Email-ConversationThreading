import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProvider } from "@/lib/get-provider";
import { getInboxState, filterMessages } from "@/lib/inbox";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId") ?? undefined;
  const labelId = searchParams.get("labelId") ?? undefined;
  const conversationId = searchParams.get("conversationId") ?? undefined;

  const session = await getServerSession(authOptions);
  const userId = session?.userId ?? "mock";
  const provider = getProvider(session?.accessToken);
  const { messages, messageToConversation } = await getInboxState(provider, userId);
  const filtered = filterMessages(messages, messageToConversation, {
    threadId,
    labelId,
    conversationId,
  });

  return Response.json({ messages: filtered });
}
