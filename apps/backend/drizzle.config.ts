import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/**/*.schema.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
