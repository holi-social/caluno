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

const {
  deleteLocaleCookie,
  getLocaleCookie,
  setLocaleCookie,
  setLocaleCookieIfSupported,
} = await import('../locale-cookie');

describe('locale-cookie', () => {
  beforeEach(() => {
    cookieStore.clear();
    removeCalls.length = 0;
  });

  afterEach(() => {
    mock.restore();
  });

  it('reads the caluno.locale cookie', () => {
    cookieStore.set(USER_LOCALE_COOKIE, 'de');

    expect(getLocaleCookie()).toBe('de');
  });

  it('returns undefined when the cookie is missing', () => {
    expect(getLocaleCookie()).toBeUndefined();
  });

  it('sets the caluno.locale cookie', () => {
    setLocaleCookie('de');

    expect(cookieStore.get(USER_LOCALE_COOKIE)).toBe('de');
  });

  it('deletes the caluno.locale cookie', () => {
    cookieStore.set(USER_LOCALE_COOKIE, 'de');

    deleteLocaleCookie();

    expect(cookieStore.has(USER_LOCALE_COOKIE)).toBe(false);
    expect(removeCalls).toContain(USER_LOCALE_COOKIE);
  });

  describe('setLocaleCookieIfSupported', () => {
    it('sets the cookie and returns the locale for a supported value', () => {
      expect(setLocaleCookieIfSupported('de')).toBe('de');
      expect(cookieStore.get(USER_LOCALE_COOKIE)).toBe('de');
    });

    it('returns null and does not set the cookie for an unsupported value', () => {
      expect(setLocaleCookieIfSupported('fr')).toBeNull();
      expect(cookieStore.has(USER_LOCALE_COOKIE)).toBe(false);
    });

    it('returns null and does not set the cookie for a non-string value', () => {
      expect(setLocaleCookieIfSupported(null)).toBeNull();
      expect(cookieStore.has(USER_LOCALE_COOKIE)).toBe(false);
    });
  });
});
