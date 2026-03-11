import { getInboxState, getMessagesInConversation } from "@/lib/inbox";
import { getEffectiveTitle } from "@/lib/conversation-overrides";
import { getProvider } from "@/lib/get-provider";

export async function GET() {
  const provider = await getProvider();
  const { messages, conversations, messageToConversation } =
    await getInboxState(provider);
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
