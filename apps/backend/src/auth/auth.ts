import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';
import { Database } from '../database/database.module';

type EmailOtpType =
  | 'sign-in'
  | 'email-verification'
  | 'forget-password'
  | 'change-email';

export interface SendVerificationOtpOptions {
  email: string;
  otp: string;
  type: EmailOtpType;
}

export interface SendResetPasswordOptions {
  email: string;
  token: string;
}

export interface AuthConfigOptions {
  database: Database | object;
  trustedOrigins: string[];
  /** Root domain for cross-subdomain cookies (e.g. "clippy.holi.social"). Set when frontend and API use different subdomains. */
  cookieDomain?: string;
  emailVerificationEnabled?: boolean;
  sendVerificationOTP: (options: SendVerificationOtpOptions) => Promise<void>;
  sendResetPassword: (options: SendResetPasswordOptions) => Promise<void>;
}

export const createAuthConfig = ({
  database,
  trustedOrigins,
  cookieDomain,
  emailVerificationEnabled = true,
  sendVerificationOTP,
  sendResetPassword,
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
    autoSignIn: false,
    requireEmailVerification: emailVerificationEnabled,
    async sendResetPassword({ user, token }) {
      await sendResetPassword({ email: user.email, token });
    },
  },
  emailVerification: {
    sendOnSignUp: emailVerificationEnabled,
    autoSignInAfterVerification: true,
  },
  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        await sendVerificationOTP({ email, otp, type });
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
