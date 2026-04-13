import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { helpExperimentDb?: Db };

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

export const db: Db =
  globalForDb.helpExperimentDb ??
  drizzle({ connection: databaseUrl(), schema });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.helpExperimentDb = db;
}
