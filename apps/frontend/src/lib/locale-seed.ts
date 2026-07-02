import { type Locale, SUPPORTED_LOCALES } from '@repo/data';
import { cookies } from 'next/headers';
import { getDataClient } from './data-client';
import { USER_LOCALE_COOKIE } from './locale-constants';

/**
 * Resolve the locale to seed the `clippy.locale` preference cookie with, for an
 * authenticated user who does not have the cookie yet. Returns the stored
 * `me.locale` when the cookie is missing, otherwise `null`.
 *
 * The cookie itself is written client-side by `<LocaleCookieSeeder>` — a Server
 * Component render may read cookies but not set them.
 */
export async function resolveLocaleSeed(
  orgUId?: string,
): Promise<Locale | null> {
  const cookieStore = await cookies();
  if (cookieStore.get(USER_LOCALE_COOKIE)?.value) {
    return null;
  }

  try {
    const data = await getDataClient(orgUId ? { orgUId } : undefined);
    const me = await data.user.getMe();
    return me.locale && SUPPORTED_LOCALES.includes(me.locale as Locale)
      ? (me.locale as Locale)
      : null;
  } catch {
    // Best-effort: never block rendering on the seed.
    return null;
  }
}
