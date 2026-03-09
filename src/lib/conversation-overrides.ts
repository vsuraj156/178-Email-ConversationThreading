const titleOverrides = new Map<string, string>();

export function getConversationTitleOverride(conversationId: string): string | undefined {
  return titleOverrides.get(conversationId);
}

export function setConversationTitleOverride(conversationId: string, title: string): void {
  titleOverrides.set(conversationId, title);
}

export function getEffectiveTitle(conversationId: string, defaultTitle: string): string {
  return titleOverrides.get(conversationId) ?? defaultTitle;
}
