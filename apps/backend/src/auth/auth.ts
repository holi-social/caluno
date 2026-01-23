import { BetterAuthOptions, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username } from 'better-auth/plugins';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export const createAuthConfig = (
    database: NodePgDatabase | object,
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
    plugins: [username()],
});

export const auth = betterAuth(createAuthConfig({}, []));
