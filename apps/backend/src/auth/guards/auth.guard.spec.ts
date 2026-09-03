const mockConstructorArgs: Array<{
  reflector: unknown;
  options: {
    auth: {
      api: { getSession: (args: unknown) => Promise<unknown> };
      options: { basePath: string };
    };
  };
}> = [];

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: class MockAuthGuard {
    constructor(
      reflector: unknown,
      options: {
        auth: {
          api: { getSession: (args: unknown) => Promise<unknown> };
          options: { basePath: string };
        };
      },
    ) {
      mockConstructorArgs.push({ reflector, options });
    }
  },
}));

import { Reflector } from '@nestjs/core';
import type { AuthService } from '@thallesp/nestjs-better-auth';
import { createSessionCachingAuthGuard } from './auth.guard';

const session = { session: { id: 'session-1' }, user: { id: 'user-1' } };

type AuthInstance = AuthService['instance'];

const newAuth = (sessionResult: unknown = session) => {
  const getSession = jest.fn().mockResolvedValue(sessionResult);
  const getUser = jest.fn().mockResolvedValue({ id: 'user-1' });
  const auth = {
    api: { getSession, getUser },
    options: { basePath: '/api/auth' },
  } as unknown as AuthInstance;
  return { auth, getSession, getUser };
};

const newWrapper = (sessionResult?: unknown) => {
  const { auth, getSession, getUser } = newAuth(sessionResult);
  createSessionCachingAuthGuard(new Reflector(), {
    instance: auth,
  } as unknown as AuthService);
  const { options } = mockConstructorArgs[mockConstructorArgs.length - 1];
  return { wrapped: options.auth, auth, getSession, getUser };
};

describe('session-caching auth wrapper', () => {
  it('calls the underlying getSession once for repeated calls', async () => {
    const { wrapped, getSession } = newWrapper();

    const first = await wrapped.api.getSession({ headers: new Headers() });
    const second = await wrapped.api.getSession({ headers: new Headers() });

    expect(getSession).toHaveBeenCalledTimes(1);
    expect(getSession).toHaveBeenCalledWith({ headers: new Headers() });
    expect(first).toEqual(session);
    expect(second).toEqual(session);
  });

  it('shares the in-flight promise between concurrent calls', async () => {
    const { wrapped, getSession } = newWrapper();

    const [first, second] = await Promise.all([
      wrapped.api.getSession({ headers: new Headers() }),
      wrapped.api.getSession({ headers: new Headers() }),
    ]);

    expect(getSession).toHaveBeenCalledTimes(1);
    expect(first).toEqual(session);
    expect(second).toEqual(session);
  });

  it('memoizes a null session (@AllowAnonymous and @Public scenarios) without refiring', async () => {
    const { wrapped, getSession } = newWrapper(null);

    const first = await wrapped.api.getSession({ headers: new Headers() });
    const second = await wrapped.api.getSession({ headers: new Headers() });

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(getSession).toHaveBeenCalledTimes(1);
  });

  it('re-attempts getSession after a rejection instead of caching it', async () => {
    const { wrapped, getSession } = newWrapper();
    getSession.mockRejectedValueOnce(new Error('transient failure'));

    await expect(
      wrapped.api.getSession({ headers: new Headers() }),
    ).rejects.toThrow('transient failure');
    const second = await wrapped.api.getSession({ headers: new Headers() });

    expect(second).toEqual(session);
    expect(getSession).toHaveBeenCalledTimes(2);
  });

  it('caches independently per wrapper instance', async () => {
    const first = newWrapper();
    const second = newWrapper();

    await first.wrapped.api.getSession({ headers: new Headers() });
    await first.wrapped.api.getSession({ headers: new Headers() });
    await second.wrapped.api.getSession({ headers: new Headers() });

    expect(first.getSession).toHaveBeenCalledTimes(1);
    expect(second.getSession).toHaveBeenCalledTimes(1);
  });
});
