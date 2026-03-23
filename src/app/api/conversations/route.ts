import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInboxState, getMessagesInConversation } from "@/lib/inbox";
import { getEffectiveTitle } from "@/lib/conversation-overrides";
import { getProvider } from "@/lib/get-provider";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.userId ?? "mock";
  const provider = getProvider(session?.accessToken);
  const { messages, conversations, messageToConversation } =
    await getInboxState(provider, userId);
  const enriched = conversations.map((c) => {
    const convMessages = getMessagesInConversation(
      messages,
      messageToConversation,
      c.id
    );
    const latest = convMessages[convMessages.length - 1];
    return {
      ...c,
      title: getEffectiveTitle(userId, c.id, c.title),
      snippet: latest?.snippet ?? "",
    };
  });
  return Response.json({ conversations: enriched });
}
