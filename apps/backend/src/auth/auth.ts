import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';
import { Database } from '../database/database.module';
import { resolveRequestLocale } from '../graphql/locale';
import { headersFromRequest } from './auth-headers';
import {
  accounts,
  sessions,
  users,
  verifications,
} from './schemas/auth.schema';

type EmailOtpType =
  | 'sign-in'
  | 'email-verification'
  | 'forget-password'
  | 'change-email';

export interface SendVerificationOtpOptions {
  email: string;
  otp: string;
  type: EmailOtpType;
  headers: Record<string, unknown>;
}

export interface SendResetPasswordOptions {
  email: string;
  token: string;
  userId: string;
  headers: Record<string, unknown>;
}

export interface AuthConfigOptions {
  database: Database | object;
  trustedOrigins: string[];
  /** Root domain for cross-subdomain cookies (e.g. "caluno.org"). Set when frontend and API use different subdomains. */
  cookieDomain?: string;
  emailVerificationEnabled?: boolean;
  sendVerificationOTP: (options: SendVerificationOtpOptions) => Promise<void>;
  sendResetPassword: (options: SendResetPasswordOptions) => Promise<void>;
  onSessionCreated?: (userId: string) => void;
}

export const createAuthConfig = ({
  database,
  trustedOrigins,
  cookieDomain,
  emailVerificationEnabled = true,
  sendVerificationOTP,
  sendResetPassword,
  onSessionCreated,
}: AuthConfigOptions): BetterAuthOptions => ({
  database: drizzleAdapter(database, {
    schema: {
      users,
      sessions,
      accounts,
      verifications,
    },
    usePlural: true,
    provider: 'pg',
  }),
  user: {
    additionalFields: {
      locale: {
        type: 'string',
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          const locale = resolveRequestLocale(headersFromRequest(ctx?.request));

          return {
            data: {
              ...user,
              locale,
            },
          };
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          if (typeof session.userId === 'string') {
            onSessionCreated?.(session.userId);
          }
        },
      },
    },
  },
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
    autoSignIn: false,
    requireEmailVerification: emailVerificationEnabled,
    async sendResetPassword({ user, token }, request) {
      await sendResetPassword({
        email: user.email,
        token,
        userId: user.id,
        headers: headersFromRequest(request),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: emailVerificationEnabled,
    autoSignInAfterVerification: true,
  },
  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }, ctx) {
        await sendVerificationOTP({
          email,
          otp,
          type,
          headers: headersFromRequest(ctx?.request),
        });
      },
    }),
  ],
});

export const auth = betterAuth(
  createAuthConfig({
    database: {},
    trustedOrigins: [],
    cookieDomain: undefined,
    sendVerificationOTP: async () => {},
    sendResetPassword: async () => {},
  }),
);
