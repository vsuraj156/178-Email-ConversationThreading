import { NextRequest } from "next/server";
import { mockProvider } from "@/lib/mock-provider";
import { getInboxState, filterMessages } from "@/lib/inbox";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId") ?? undefined;
  const labelId = searchParams.get("labelId") ?? undefined;
  const conversationId = searchParams.get("conversationId") ?? undefined;

  const { messages, messageToConversation } = await getInboxState(mockProvider);
  const filtered = filterMessages(messages, messageToConversation, {
    threadId,
    labelId,
    conversationId,
  });

  return Response.json({ messages: filtered });
}
