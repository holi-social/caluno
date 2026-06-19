import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { ReactElement } from 'react';

type AuthPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirectTo?: string }>;
};

type AuthPage = (props: AuthPageProps) => Promise<ReactElement>;

type AuthFormElement = ReactElement<{ redirectTo?: string }>;
type AuthPageShellElement = ReactElement<{
  title: string;
  children: AuthFormElement;
}>;

const cookieValues = new Map<string, string>();
let postAuthDestination = '/organizations';
let hasSession = false;
let isAuthenticatedUser = false;

const redirectCalls: Array<{ href: string; locale: string }> = [];

mock.module('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieValues.get(name);
      return value !== undefined ? { name, value } : undefined;
    },
  }),
}));

mock.module('@/lib/post-auth-routing', () => ({
  resolvePostAuthDestination: async () => postAuthDestination,
}));

mock.module('@/i18n/navigation', () => ({
  Link: () => null,
  redirect: (args: { href: string; locale: string }) => {
    redirectCalls.push(args);
    throw new Error('NEXT_REDIRECT');
  },
  usePathname: () => '/',
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    refresh: () => {},
  }),
  getPathname: () => '/',
}));

mock.module('../login/login-form', () => ({
  LoginForm: () => null,
}));

mock.module('../signup/signup-form', () => ({
  SignupForm: () => null,
}));

mock.module('next-intl/server', () => ({
  setRequestLocale: () => {},
  getTranslations: async () => (key: string) => key,
}));

mock.module('@/lib/auth-server', () => ({
  getSession: async () => (hasSession ? { user: { id: 'user-1' } } : null),
  isAuthenticated: async () => isAuthenticatedUser,
}));

const LoginPage = (await import('../login/page')).default as AuthPage;

const SignupPage = (await import('../signup/page')).default as AuthPage;

function getFormRedirectTo(element: ReactElement): string | undefined {
  const shell = element as AuthPageShellElement;
  return shell.props.children.props.redirectTo;
}

async function expectRedirect(
  page: AuthPage,
  searchParams: { redirectTo?: string },
  expectedHref: string,
) {
  await expect(
    page({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve(searchParams),
    }),
  ).rejects.toThrow('NEXT_REDIRECT');

  expect(redirectCalls.at(-1)).toEqual({ href: expectedHref, locale: 'en' });
}

describe('auth pages', () => {
  beforeEach(() => {
    cookieValues.clear();
    postAuthDestination = '/organizations';
    hasSession = false;
    isAuthenticatedUser = false;
    redirectCalls.length = 0;
  });

  describe('login page', () => {
    it('redirects authenticated users to explicit redirectTo', async () => {
      hasSession = true;

      await expectRedirect(
        LoginPage,
        { redirectTo: '/admin/org-1' },
        '/admin/org-1',
      );
    });

    it('redirects authenticated users to resolvePostAuthDestination when no explicit redirect', async () => {
      hasSession = true;
      postAuthDestination = '/admin/last-org';

      await expectRedirect(LoginPage, {}, '/admin/last-org');
    });

    it('renders LoginForm with redirectTo for unauthenticated users', async () => {
      const page = await LoginPage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({ redirectTo: '/admin/org-1' }),
      });

      expect(getFormRedirectTo(page)).toBe('/admin/org-1');
      expect(redirectCalls).toHaveLength(0);
    });

    it('redirects authenticated users to pending_invite destination', async () => {
      hasSession = true;
      cookieValues.set('pending_invite', 'token-abc');

      await expectRedirect(LoginPage, {}, '/invite/token-abc');
    });

    it('renders LoginForm with invite destination from pending_invite cookie', async () => {
      cookieValues.set('pending_invite', 'token-abc');

      const page = await LoginPage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({}),
      });

      expect(getFormRedirectTo(page)).toBe('/invite/token-abc');
    });
  });

  describe('signup page', () => {
    it('redirects authenticated users to explicit redirectTo', async () => {
      isAuthenticatedUser = true;

      await expectRedirect(
        SignupPage,
        { redirectTo: '/admin/org-1' },
        '/admin/org-1',
      );
    });

    it('redirects authenticated users to resolvePostAuthDestination when no explicit redirect', async () => {
      isAuthenticatedUser = true;
      postAuthDestination = '/admin/last-org';

      await expectRedirect(SignupPage, {}, '/admin/last-org');
    });

    it('renders SignupForm with redirectTo for unauthenticated users', async () => {
      const page = await SignupPage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({ redirectTo: '/admin/org-1' }),
      });

      expect(getFormRedirectTo(page)).toBe('/admin/org-1');
      expect(redirectCalls).toHaveLength(0);
    });

    it('redirects authenticated users to pending_invite destination', async () => {
      isAuthenticatedUser = true;
      cookieValues.set('pending_invite', 'token-abc');

      await expectRedirect(SignupPage, {}, '/invite/token-abc');
    });

    it('renders SignupForm with invite destination from pending_invite cookie', async () => {
      cookieValues.set('pending_invite', 'token-abc');

      const page = await SignupPage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({}),
      });

      expect(getFormRedirectTo(page)).toBe('/invite/token-abc');
    });
  });
});
