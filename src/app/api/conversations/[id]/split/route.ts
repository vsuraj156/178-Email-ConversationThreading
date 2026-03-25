import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProvider } from "@/lib/get-provider";
import { getInboxState, invalidateConversations } from "@/lib/inbox";
import { applyMessageOverrides } from "@/lib/manual-overrides";

// POST /api/conversations/[id]/split
// Body: { messageIds: string[] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.userId ?? "mock";

  const body = await request.json().catch(() => ({}));
  const messageIds: string[] = body.messageIds ?? [];

  if (messageIds.length === 0) {
    return Response.json({ error: "messageIds required" }, { status: 400 });
  }

  // Verify all messages belong to this conversation
  const provider = getProvider(session?.accessToken);
  const { messageToConversation } = await getInboxState(provider, userId);
  const invalid = messageIds.filter((mid) => messageToConversation.get(mid) !== id);
  if (invalid.length > 0) {
    return Response.json({ error: "Some messages do not belong to this conversation" }, { status: 400 });
  }

  const newConvId = `manual-${Date.now()}`;
  applyMessageOverrides(
    userId,
    messageIds.map((messageId) => ({ messageId, conversationId: newConvId }))
  );
  await invalidateConversations(userId);

  return Response.json({ ok: true, newConvId });
}
