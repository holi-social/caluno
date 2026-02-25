import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface AuthConfigOptions {
  database: NodePgDatabase | object;
  trustedOrigins: string[];
  /** Root domain for cross-subdomain cookies (e.g. "clippy.holi.social"). Set when frontend and API use different subdomains. */
  cookieDomain?: string;
}

export const createAuthConfig = (
  { database, trustedOrigins, cookieDomain }: AuthConfigOptions,
): BetterAuthOptions => ({
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
  plugins: [],
});

export const auth = betterAuth(
  createAuthConfig({ database: {}, trustedOrigins: [], cookieDomain: undefined }),
);
