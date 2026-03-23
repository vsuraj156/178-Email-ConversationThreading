import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInboxState, getMessagesInConversation } from "@/lib/inbox";
import { getEffectiveTitle, setConversationTitleOverride } from "@/lib/conversation-overrides";
import { getProvider } from "@/lib/get-provider";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.userId ?? "mock";
  const provider = getProvider(session?.accessToken);
  const { messages, conversations, messageToConversation } =
    await getInboxState(provider, userId);

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
      title: getEffectiveTitle(userId, id, conversation.title),
      messages: conversationMessages,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.userId ?? "mock";
  const body = await request.json().catch(() => ({}));
  const title = body.title as string | undefined;

  if (title !== undefined && typeof title === "string" && title.trim()) {
    setConversationTitleOverride(userId, id, title.trim());
    return Response.json({
      conversation: { id, title: title.trim(), updated: true },
    });
  }
  return Response.json({ conversation: { id, updated: false } });
}
