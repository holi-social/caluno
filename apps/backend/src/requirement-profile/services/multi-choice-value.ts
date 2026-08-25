/**
 * MULTI_CHOICE selections arrive through the GraphQL `String` value channel as
 * a JSON-encoded array; commas in option values stay intact. Reads tolerate the
 * legacy comma-joined format (pre-refactor clients and in-flight submissions).
 */
export function parseMultiChoiceValue(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === 'string');
    }
  } catch {
    // legacy comma-joined format — fall through
  }
  return raw.split(',');
}
