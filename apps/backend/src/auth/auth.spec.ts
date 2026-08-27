jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

jest.mock('@better-auth/drizzle-adapter', () => ({
  drizzleAdapter: jest.fn(() => ({ id: 'drizzle-adapter' })),
}));

jest.mock('better-auth', () => ({
  betterAuth: jest.fn((config) => config),
  APIError: class APIError extends Error {
    constructor(
      public status: string,
      public body: { message: string },
    ) {
      super(body.message);
      this.name = 'APIError';
    }
  },
}));

jest.mock('better-auth/plugins', () => ({
  emailOTP: jest.fn(() => ({ id: 'email-otp' })),
}));

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { APIError } from 'better-auth';
import { createAuthConfig } from './auth';

const privacyPolicyDirectory = mkdtempSync(
  join(tmpdir(), 'auth-privacy-policy-'),
);
writeFileSync(
  join(privacyPolicyDirectory, 'datenschutzhinweise-2026-08-17.pdf'),
  'old',
);
writeFileSync(
  join(privacyPolicyDirectory, 'datenschutzhinweise-2026-08-25.pdf'),
  'new',
);

const authConfig = () =>
  createAuthConfig({
    database: {},
    trustedOrigins: [],
    sendVerificationOTP: jest.fn(),
    sendResetPassword: jest.fn(),
    privacyPolicyDirectory,
  });

describe('createAuthConfig', () => {
  it('does not declare privacyPolicyAccepted as an additional user field', () => {
    const config = authConfig();

    expect(config.user?.additionalFields).not.toHaveProperty(
      'privacyPolicyAccepted',
    );
  });

  it('sets user locale from x-locale on sign up', async () => {
    const config = authConfig();

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
      {
        request,
        body: { privacyPolicyAccepted: true },
      } as never,
    );

    expect(result).toEqual({
      data: expect.objectContaining({
        locale: 'de',
        privacyPolicyVersion: '2026-08-25',
        privacyPolicyAcceptedAt: expect.any(Date),
      }),
    });
    expect(result).toEqual({
      data: expect.not.objectContaining({
        privacyPolicyAccepted: expect.anything(),
      }),
    });
  });

  it('ignores privacyPolicyAccepted on the user payload', async () => {
    const config = authConfig();

    const beforeCreate = config.databaseHooks?.user?.create?.before;
    expect(beforeCreate).toBeDefined();

    await expect(
      beforeCreate?.(
        {
          id: 'user-1',
          email: 'volunteer@example.com',
          name: 'Volunteer',
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          privacyPolicyAccepted: true,
        },
        {
          request: new Request('http://localhost:8080/api/auth/sign-up/email'),
        } as never,
      ),
    ).rejects.toBeInstanceOf(APIError);
  });

  it('rejects sign up without privacy policy acceptance', async () => {
    const config = authConfig();

    const beforeCreate = config.databaseHooks?.user?.create?.before;
    expect(beforeCreate).toBeDefined();

    await expect(
      beforeCreate?.(
        {
          id: 'user-1',
          email: 'volunteer@example.com',
          name: 'Volunteer',
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          request: new Request('http://localhost:8080/api/auth/sign-up/email'),
        } as never,
      ),
    ).rejects.toBeInstanceOf(APIError);
  });

  it('rejects sign up that only sends a stale version', async () => {
    const config = authConfig();

    const beforeCreate = config.databaseHooks?.user?.create?.before;
    expect(beforeCreate).toBeDefined();

    await expect(
      beforeCreate?.(
        {
          id: 'user-1',
          email: 'volunteer@example.com',
          name: 'Volunteer',
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          privacyPolicyVersion: '1999-01-01',
        },
        {
          request: new Request('http://localhost:8080/api/auth/sign-up/email'),
        } as never,
      ),
    ).rejects.toMatchObject({
      message: 'Privacy policy must be accepted',
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

  it('calls onSessionCreated with the session user id after session create', async () => {
    const onSessionCreated = jest.fn();
    const onUserCreated = jest.fn();
    const config = createAuthConfig({
      database: {},
      trustedOrigins: [],
      sendVerificationOTP: jest.fn(),
      sendResetPassword: jest.fn(),
      onSessionCreated,
      onUserCreated,
    });

    const afterCreate = config.databaseHooks?.session?.create?.after;
    expect(afterCreate).toBeDefined();

    await afterCreate?.(
      {
        id: 'session-1',
        userId: 'user-1',
        token: 'token-1',
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      null,
    );

    expect(onSessionCreated).toHaveBeenCalledWith('user-1');
    expect(onUserCreated).not.toHaveBeenCalled();
  });

  it('calls onUserCreated with the user id after user create', async () => {
    const onUserCreated = jest.fn();
    const onSessionCreated = jest.fn();
    const config = createAuthConfig({
      database: {},
      trustedOrigins: [],
      sendVerificationOTP: jest.fn(),
      sendResetPassword: jest.fn(),
      onUserCreated,
      onSessionCreated,
    });

    const afterCreate = config.databaseHooks?.user?.create?.after;
    expect(afterCreate).toBeDefined();

    await afterCreate?.(
      {
        id: 'user-1',
        email: 'volunteer@example.com',
        name: 'Volunteer',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      null,
    );

    expect(onUserCreated).toHaveBeenCalledWith('user-1');
    expect(onSessionCreated).not.toHaveBeenCalled();
  });

  it('does not throw after user create when onUserCreated is omitted', async () => {
    const config = createAuthConfig({
      database: {},
      trustedOrigins: [],
      sendVerificationOTP: jest.fn(),
      sendResetPassword: jest.fn(),
    });

    const afterCreate = config.databaseHooks?.user?.create?.after;
    expect(afterCreate).toBeDefined();

    await expect(
      afterCreate?.(
        {
          id: 'user-1',
          email: 'volunteer@example.com',
          name: 'Volunteer',
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        null,
      ),
    ).resolves.toBeUndefined();
  });
});
