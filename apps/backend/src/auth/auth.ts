import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { Database } from '../database/database.module';
import { generateCheckInId } from './checkInId';

export interface AuthConfigOptions {
  database: Database | object;
  trustedOrigins: string[];
  /** Root domain for cross-subdomain cookies (e.g. "clippy.holi.social"). Set when frontend and API use different subdomains. */
  cookieDomain?: string;
}

export const createAuthConfig = ({
  database,
  trustedOrigins,
  cookieDomain,
}: AuthConfigOptions): BetterAuthOptions => ({
  database: drizzleAdapter(database, {
    usePlural: true,
    provider: 'pg',
  }),
  trustedOrigins,
  ...(cookieDomain && {
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
        domain: cookieDomain,
      },
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              checkInId: generateCheckInId(),
            },
          };
        },
      },
    },
  },
  plugins: [],
});

export const auth = betterAuth(
  createAuthConfig({
    database: {},
    trustedOrigins: [],
    cookieDomain: undefined,
  }),
);
