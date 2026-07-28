import type { Locale } from '@repo/data';
import { setLocaleCookie } from './locale-cookie';

interface SaveLocalePreferenceDeps {
  selected: Locale;
  current: string;
  updateLocale: (locale: Locale) => Promise<unknown>;
  navigate: (locale: Locale) => void;
}

/**
 * Persist an explicit locale choice: backend (`users.locale`) → `clippy.locale`
 * preference cookie → URL. Writing the cookie before navigating means the
 * proxy sees a cookie that already matches the target URL, so it does not
 * redirect. No-op when the choice equals the active locale.
 */
export async function saveLocalePreference({
  selected,
  current,
  updateLocale,
  navigate,
}: SaveLocalePreferenceDeps): Promise<void> {
  if (selected === current) {
    return;
  }

  await updateLocale(selected);
  setLocaleCookie(selected);
  navigate(selected);
}
