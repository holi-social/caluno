'use client';

import type { Locale } from '@repo/data';
import { useEffect } from 'react';
import { getLocaleCookie, setLocaleCookie } from '@/lib/locale-cookie';

/**
 * Seeds the `clippy.locale` preference cookie once, client-side, from the
 * authenticated user's stored locale. Rendered by the authenticated layouts
 * only when the cookie is missing (see `resolveLocaleSeed`). Renders nothing.
 */
export function LocaleCookieSeeder({ value }: { value: Locale }) {
  useEffect(() => {
    if (!getLocaleCookie()) {
      setLocaleCookie(value);
    }
  }, [value]);

  return null;
}
