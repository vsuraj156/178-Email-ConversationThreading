import { getInboxState, getMessagesInConversation } from "@/lib/inbox";
import { getEffectiveTitle } from "@/lib/conversation-overrides";
import { mockProvider } from "@/lib/mock-provider";

export async function GET() {
  const { messages, conversations, messageToConversation } =
    await getInboxState(mockProvider);
  const enriched = conversations.map((c) => {
    const convMessages = getMessagesInConversation(
      messages,
      messageToConversation,
      c.id
    );
    const latest = convMessages[convMessages.length - 1];
    return {
      ...c,
      title: getEffectiveTitle(c.id, c.title),
      snippet: latest?.snippet ?? "",
    };
  });
  return Response.json({ conversations: enriched });
}
