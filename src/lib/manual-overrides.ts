// Per-user manual message→conversation assignments (set by merge/split operations)
const messageOverrides = new Map<string, Map<string, string>>();

export function getMessageOverrides(userId: string): Map<string, string> {
  return messageOverrides.get(userId) ?? new Map();
}

export function applyMessageOverrides(
  userId: string,
  assignments: { messageId: string; conversationId: string }[]
): void {
  if (!messageOverrides.has(userId)) messageOverrides.set(userId, new Map());
  const map = messageOverrides.get(userId)!;
  for (const { messageId, conversationId } of assignments) {
    map.set(messageId, conversationId);
  }
}
