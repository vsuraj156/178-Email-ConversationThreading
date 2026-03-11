import { NextRequest } from "next/server";
import { getProvider } from "@/lib/get-provider";
import { getInboxState, filterMessages } from "@/lib/inbox";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId") ?? undefined;
  const labelId = searchParams.get("labelId") ?? undefined;
  const conversationId = searchParams.get("conversationId") ?? undefined;

  const provider = await getProvider();
  const { messages, messageToConversation } = await getInboxState(provider);
  const filtered = filterMessages(messages, messageToConversation, {
    threadId,
    labelId,
    conversationId,
  });

  return Response.json({ messages: filtered });
}
