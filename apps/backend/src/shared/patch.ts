/**
 * Returns a shallow copy of `input` with all `undefined` entries removed.
 * `null` values are preserved so callers can explicitly clear nullable columns.
 */
export function patch<T extends object>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}
