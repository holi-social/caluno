jest.mock('@better-auth/drizzle-adapter', () => ({
  drizzleAdapter: jest.fn(() => ({ id: 'drizzle-adapter' })),
}));

jest.mock('better-auth', () => ({
  betterAuth: jest.fn((config) => config),
}));

jest.mock('better-auth/plugins', () => ({
  emailOTP: jest.fn(() => ({ id: 'email-otp' })),
}));

import { createAuthConfig } from './auth';

describe('createAuthConfig', () => {
  it('delegates Better Auth password reset emails to the configured sender', async () => {
    const sendResetPassword = jest.fn().mockResolvedValue(undefined);
    const config = createAuthConfig({
      database: {},
      trustedOrigins: [],
      sendVerificationOTP: jest.fn(),
      sendResetPassword,
    });

    const emailAndPassword = config.emailAndPassword as unknown as {
      sendResetPassword: (data: {
        user: { email: string };
        url: string;
        token: string;
      }) => Promise<void>;
    };

    await emailAndPassword.sendResetPassword({
      user: { email: 'volunteer@example.com' },
      url: 'http://localhost:8080/api/auth/reset-password/reset-token-1',
      token: 'reset-token-1',
    });

    expect(sendResetPassword).toHaveBeenCalledWith({
      email: 'volunteer@example.com',
      token: 'reset-token-1',
    });
  });
});
