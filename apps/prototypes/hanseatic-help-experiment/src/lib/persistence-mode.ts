export type PersistenceMode = 'json' | 'postgres';

/**
 * - `HELP_EXPERIMENT_STORAGE=json` | `postgres` — explicit override (works with any NODE_ENV).
 * - Otherwise: `postgres` when NODE_ENV is production, else `json` (local `next dev` needs no DB).
 */
export function getPersistenceMode(): PersistenceMode {
  const raw = process.env.HELP_EXPERIMENT_STORAGE?.trim().toLowerCase();
  if (raw === 'json' || raw === 'file') return 'json';
  if (raw === 'postgres' || raw === 'pg' || raw === 'sql') return 'postgres';
  return process.env.NODE_ENV === 'production' ? 'postgres' : 'json';
}
