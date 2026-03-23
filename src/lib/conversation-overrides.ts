// Keyed by userId → conversationId → title
const overridesByUser = new Map<string, Map<string, string>>();

function getUserOverrides(userId: string): Map<string, string> {
  if (!overridesByUser.has(userId)) {
    overridesByUser.set(userId, new Map());
  }
  return overridesByUser.get(userId)!;
}

export function getEffectiveTitle(
  userId: string,
  conversationId: string,
  defaultTitle: string
): string {
  return getUserOverrides(userId).get(conversationId) ?? defaultTitle;
}

export function setConversationTitleOverride(
  userId: string,
  conversationId: string,
  title: string
): void {
  getUserOverrides(userId).set(conversationId, title);
}
