import { NextRequest } from "next/server";
import { getInboxState, getMessagesInConversation } from "@/lib/inbox";
import { getEffectiveTitle, setConversationTitleOverride } from "@/lib/conversation-overrides";
import { mockProvider } from "@/lib/mock-provider";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { messages, conversations, messageToConversation } =
    await getInboxState(mockProvider);

  const conversation = conversations.find((c) => c.id === id);
  if (!conversation) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }

  const conversationMessages = getMessagesInConversation(
    messages,
    messageToConversation,
    id
  );

  return Response.json({
    conversation: {
      ...conversation,
      title: getEffectiveTitle(id, conversation.title),
      messages: conversationMessages,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const title = body.title as string | undefined;

  if (title !== undefined && typeof title === "string" && title.trim()) {
    setConversationTitleOverride(id, title.trim());
    return Response.json({
      conversation: { id, title: title.trim(), updated: true },
    });
  }
  return Response.json({ conversation: { id, updated: false } });
}
