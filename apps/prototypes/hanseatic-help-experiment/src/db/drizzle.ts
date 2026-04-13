import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { requirePgPoolConfig } from './pg-env';

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { helpExperimentDb?: Db };

export const db: Db =
  globalForDb.helpExperimentDb ??
  drizzle({ client: new Pool(requirePgPoolConfig()), schema });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.helpExperimentDb = db;
}
