import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

import { requirePgConnParts } from './src/db/pg-env';

config({ path: '.env' });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    ...requirePgConnParts(),
    ssl: false,
  },
});
