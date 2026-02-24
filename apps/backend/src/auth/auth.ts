import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { Database } from '../database/database.module';

export const createAuthConfig = (
  database: Database | object,
  trustedOrigins: string[],
): BetterAuthOptions => ({
  database: drizzleAdapter(database, {
    usePlural: true,
    provider: 'pg',
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  plugins: [],
});

export const auth = betterAuth(createAuthConfig({}, []));
