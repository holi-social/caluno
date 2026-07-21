type StripNullFromKeys<T, Keys extends keyof T> = {
  [K in keyof T]: K extends Keys ? Exclude<T[K], null> : T[K];
};

/**
 * Returns a shallow copy of `input` with all `undefined` entries removed.
 * `null` values are preserved so callers can explicitly clear nullable columns.
 *
 * Pass `ignoreNull` for keys mapped to non-nullable DB columns — `null` is
 * dropped for those keys (same as `undefined`: do not update).
 */
export function patch<
  T extends object,
  const IgnoreNull extends readonly (keyof T)[] = readonly [],
>(
  input: T,
  options?: { ignoreNull?: IgnoreNull },
): Partial<StripNullFromKeys<T, IgnoreNull[number]>> {
  const ignoreNull = new Set<keyof T>(options?.ignoreNull ?? []);

  return Object.fromEntries(
    Object.entries(input).filter(([key, value]) => {
      if (value === undefined) return false;
      if (value === null && ignoreNull.has(key as keyof T)) return false;
      return true;
    }),
  ) as Partial<StripNullFromKeys<T, IgnoreNull[number]>>;
}
