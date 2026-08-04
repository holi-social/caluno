import { afterEach, describe, expect, it } from 'bun:test';
import { LOCALE_COOKIE } from '../../constants';
import { readRequestLocale } from './read-request-locale';

const originalDocument = globalThis.document;
const originalWindow = globalThis.window;

function setCookie(value: string | undefined) {
  Object.defineProperty(globalThis, 'document', {
    value: value === undefined ? {} : { cookie: value },
    configurable: true,
  });
}

afterEach(() => {
  Object.defineProperty(globalThis, 'document', {
    value: originalDocument,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: originalWindow,
    configurable: true,
  });
});

describe('readRequestLocale', () => {
  it('reads the clippy.locale cookie for the x-locale header', () => {
    setCookie(`${LOCALE_COOKIE}=de`);
    expect(LOCALE_COOKIE).toBe('clippy.locale');
    expect(readRequestLocale()).toBe('de');
  });

  it('ignores an unsupported cookie value', () => {
    setCookie(`${LOCALE_COOKIE}=fr`);
    expect(readRequestLocale()).toBe('de');
  });

  it('reads the cookie alongside other cookies', () => {
    setCookie(`clippy.last_org_slug=acme; ${LOCALE_COOKIE}=de`);
    expect(readRequestLocale()).toBe('de');
  });

  it('falls back to the default locale when no cookie is present', () => {
    setCookie('');
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      configurable: true,
    });
    expect(readRequestLocale()).toBe('de');
  });
});
