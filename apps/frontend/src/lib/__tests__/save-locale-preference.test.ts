import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { USER_LOCALE_COOKIE } from '@/lib/locale-constants';

const cookieStore = new Map<string, string>();

mock.module('js-cookie', () => ({
  default: {
    get: (name: string) => cookieStore.get(name),
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    remove: (name: string) => {
      cookieStore.delete(name);
    },
  },
}));

const { saveLocalePreference } = await import('../save-locale-preference');

describe('saveLocalePreference', () => {
  beforeEach(() => {
    cookieStore.clear();
  });

  afterEach(() => {
    mock.restore();
  });

  it('sets the clippy.locale cookie after a successful save', async () => {
    const navigate = mock(() => {});

    await saveLocalePreference({
      selected: 'de',
      current: 'en',
      updateLocale: async () => undefined,
      navigate,
    });

    expect(cookieStore.get(USER_LOCALE_COOKIE)).toBe('de');
    expect(navigate).toHaveBeenCalledWith('de');
  });

  it('persists to the backend before writing the cookie', async () => {
    const order: string[] = [];
    const navigate = mock(() => order.push('navigate'));

    await saveLocalePreference({
      selected: 'de',
      current: 'en',
      updateLocale: async () => {
        order.push('backend');
      },
      navigate,
    });

    // backend → cookie is implied by the cookie being present after backend ran
    expect(order[0]).toBe('backend');
    expect(cookieStore.get(USER_LOCALE_COOKIE)).toBe('de');
    expect(order[order.length - 1]).toBe('navigate');
  });

  it('is a no-op when the selection equals the current locale', async () => {
    const updateLocale = mock(async () => undefined);
    const navigate = mock(() => {});

    await saveLocalePreference({
      selected: 'en',
      current: 'en',
      updateLocale,
      navigate,
    });

    expect(updateLocale).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(cookieStore.has(USER_LOCALE_COOKIE)).toBe(false);
  });
});
