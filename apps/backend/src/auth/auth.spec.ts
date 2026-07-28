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
  it('sets user locale from x-locale on sign up', async () => {
    const config = createAuthConfig({
      database: {},
      trustedOrigins: [],
      sendVerificationOTP: jest.fn(),
      sendResetPassword: jest.fn(),
    });

    const beforeCreate = config.databaseHooks?.user?.create?.before;
    expect(beforeCreate).toBeDefined();

    const request = new Request(
      'http://localhost:8080/api/auth/sign-up/email',
      {
        headers: {
          'x-locale': 'de',
        },
      },
    );

    const result = await beforeCreate?.(
      {
        id: 'user-1',
        email: 'volunteer@example.com',
        name: 'Volunteer',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { request } as never,
    );

    expect(result).toEqual({
      data: expect.objectContaining({
        locale: 'de',
      }),
    });
  });

  it('delegates Better Auth password reset emails to the configured sender', async () => {
    const sendResetPassword = jest.fn().mockResolvedValue(undefined);
    const config = createAuthConfig({
      database: {},
      trustedOrigins: [],
      sendVerificationOTP: jest.fn(),
      sendResetPassword,
    });

    const emailAndPassword = config.emailAndPassword as unknown as {
      sendResetPassword: (
        data: {
          user: { id: string; email: string };
          url: string;
          token: string;
        },
        request: Request,
      ) => Promise<void>;
    };

    const request = new Request(
      'http://localhost:8080/api/auth/request-password-reset',
      {
        headers: {
          'x-locale': 'de',
        },
      },
    );

    await emailAndPassword.sendResetPassword(
      {
        user: { id: 'user-1', email: 'volunteer@example.com' },
        url: 'http://localhost:8080/api/auth/reset-password/reset-token-1',
        token: 'reset-token-1',
      },
      request,
    );

    expect(sendResetPassword).toHaveBeenCalledWith({
      email: 'volunteer@example.com',
      token: 'reset-token-1',
      userId: 'user-1',
      headers: {
        'x-locale': 'de',
      },
    });
  });
});
