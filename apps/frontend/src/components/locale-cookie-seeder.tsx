'use client';

import type { Locale } from '@repo/data';
import { useLocale } from 'next-intl';
import { useEffect } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { getLocaleCookie, setLocaleCookie } from '@/lib/locale-cookie';

/**
 * Seeds the `clippy.locale` preference cookie once, client-side, from the
 * authenticated user's stored locale. When the seeded locale differs from the
 * current URL locale, it replaces the current history entry with the correct
 * locale so the user does not have to refresh manually. Rendered by the
 * authenticated layouts only when the cookie is missing (see
 * `resolveLocaleSeed`). Renders nothing.
 */
export function LocaleCookieSeeder({ value }: { value: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  useEffect(() => {
    if (getLocaleCookie()) {
      return;
    }

    setLocaleCookie(value);

    if (currentLocale !== value) {
      router.replace(pathname, { locale: value });
    }
  }, [value, currentLocale, pathname, router]);

  return null;
}
