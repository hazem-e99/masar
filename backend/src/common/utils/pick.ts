/** Copies only the named own-properties. Used instead of the global whitelist pipe for older `any` bodies. */
export function pick(source: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!source || typeof source !== 'object') return {};
  const record = source as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key) && record[key] !== undefined) {
      out[key] = record[key];
    }
  }
  return out;
}

/** Escapes a user string before it is placed in a RegExp. */
export function escapeRegex(value: string): string {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
