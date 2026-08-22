// Shared by the accounting dataloaders: dedupes/caches per-key lookups
// through DataLoader without requiring a single batched SQL query, mirroring
// ShiftLoader's local `settleEach` helper.
export async function settleEach<K, T>(
  keys: readonly K[],
  load: (key: K) => Promise<T>,
): Promise<(T | Error)[]> {
  return Promise.all(
    keys.map(async (key) => {
      try {
        return await load(key);
      } catch (error) {
        return error instanceof Error ? error : new Error(String(error));
      }
    }),
  );
}
