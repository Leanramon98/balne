function isMessageBranch(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function flatMessagesToNested(messages: Record<string, string>): Record<string, unknown> {
  const nested: Record<string, unknown> = {};

  for (const [flatKey, value] of Object.entries(messages)) {
    const parts = flatKey.split('.');
    let current = nested;

    for (const [index, part] of parts.entries()) {
      const isLeaf = index === parts.length - 1;

      if (isLeaf) {
        current[part] = value;
        continue;
      }

      const next = current[part];
      if (!isMessageBranch(next)) {
        current[part] = {};
      }

      current = current[part] as Record<string, unknown>;
    }
  }

  return nested;
}
