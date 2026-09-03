import { Reflector } from '@nestjs/core';
import {
  AuthGuard,
  type AuthService,
  type UserSession,
} from '@thallesp/nestjs-better-auth';

export const createSessionCachingAuthGuard = (
  reflector: Reflector,
  authService: AuthService,
) => new AuthGuard(reflector, { auth: withSessionCache(authService.instance) });

const withSessionCache = (
  auth: AuthService['instance'],
): AuthService['instance'] => {
  let cachedSession: Promise<UserSession | null> | undefined;

  const wrapper = Object.create(auth);
  wrapper.api = Object.create(auth.api);

  wrapper.api.getSession = (
    ...args: Parameters<typeof auth.api.getSession>
  ): Promise<UserSession | null> => {
    cachedSession ??= auth.api.getSession(...args);
    return cachedSession;
  };

  return wrapper;
};
