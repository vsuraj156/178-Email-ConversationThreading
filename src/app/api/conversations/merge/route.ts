import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProvider } from "@/lib/get-provider";
import { getInboxState, getMessagesInConversation, invalidateConversations } from "@/lib/inbox";
import { applyMessageOverrides } from "@/lib/manual-overrides";

// POST /api/conversations/merge
// Body: { sourceIds: string[], targetId: string }
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.userId ?? "mock";

  const body = await request.json().catch(() => ({}));
  const sourceIds: string[] = body.sourceIds ?? [];
  const targetId: string = body.targetId ?? "";

  if (!targetId || sourceIds.length === 0) {
    return Response.json({ error: "sourceIds and targetId required" }, { status: 400 });
  }

  const provider = getProvider(session?.accessToken);
  const { messages, messageToConversation } = await getInboxState(provider, userId);

  // Collect all message IDs from the source conversations
  const assignments: { messageId: string; conversationId: string }[] = [];
  for (const sourceId of sourceIds) {
    if (sourceId === targetId) continue;
    const msgs = getMessagesInConversation(messages, messageToConversation, sourceId);
    for (const m of msgs) {
      assignments.push({ messageId: m.id, conversationId: targetId });
    }
  }

  if (assignments.length === 0) {
    return Response.json({ error: "No messages found in source conversations" }, { status: 400 });
  }

  applyMessageOverrides(userId, assignments);
  await invalidateConversations(userId);

  return Response.json({ ok: true, targetId });
}
