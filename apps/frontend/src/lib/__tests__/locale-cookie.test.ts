import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { USER_LOCALE_COOKIE } from '@/lib/locale-constants';

const cookieStore = new Map<string, string>();
const removeCalls: string[] = [];

mock.module('js-cookie', () => ({
  default: {
    get: (name: string) => cookieStore.get(name),
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    remove: (name: string) => {
      removeCalls.push(name);
      cookieStore.delete(name);
    },
  },
}));

const { deleteLocaleCookie, getLocaleCookie, setLocaleCookie } = await import(
  '../locale-cookie'
);

describe('locale-cookie', () => {
  beforeEach(() => {
    cookieStore.clear();
    removeCalls.length = 0;
  });

  afterEach(() => {
    mock.restore();
  });

  it('reads the clippy.locale cookie', () => {
    cookieStore.set(USER_LOCALE_COOKIE, 'de');

    expect(getLocaleCookie()).toBe('de');
  });

  it('returns undefined when the cookie is missing', () => {
    expect(getLocaleCookie()).toBeUndefined();
  });

  it('sets the clippy.locale cookie', () => {
    setLocaleCookie('de');

    expect(cookieStore.get(USER_LOCALE_COOKIE)).toBe('de');
  });

  it('deletes the clippy.locale cookie', () => {
    cookieStore.set(USER_LOCALE_COOKIE, 'de');

    deleteLocaleCookie();

    expect(cookieStore.has(USER_LOCALE_COOKIE)).toBe(false);
    expect(removeCalls).toContain(USER_LOCALE_COOKIE);
  });
});
