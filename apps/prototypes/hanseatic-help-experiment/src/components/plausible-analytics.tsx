'use client';

import { useEffect } from 'react';

/** Set in `.env`: site domain as configured in Plausible (e.g. `yoursite.com`). */
const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

/** Dynamic import only — `@plausible-analytics/tracker` touches `location` at module load (breaks SSR). */
let plausibleInit: Promise<void> | null = null;

/** Next app admin UI and admin API — do not send to Plausible. */
function pathnameIsAdmin(pathname: string): boolean {
  const p = pathname.toLowerCase();
  return (
    p === '/admin' ||
    p.startsWith('/admin/') ||
    p === '/api/admin' ||
    p.startsWith('/api/admin/')
  );
}

function shouldIgnoreTrackedUrl(url: string): boolean {
  try {
    return pathnameIsAdmin(new URL(url).pathname);
  } catch {
    if (!url.startsWith('/')) return false;
    const pathOnly = (url.split(/[?#]/, 1)[0] ?? url).toLowerCase();
    return pathnameIsAdmin(pathOnly);
  }
}

export function PlausibleAnalytics() {
  useEffect(() => {
    if (!domain) return;

    plausibleInit ??= import('@plausible-analytics/tracker').then(({ init }) => {
      init({
        domain,
        captureOnLocalhost: process.env.NODE_ENV === 'development',
        transformRequest: (payload) => {
          const url = typeof payload.u === 'string' ? payload.u : '';
          if (url && shouldIgnoreTrackedUrl(url)) return null;
          return payload;
        },
      });
    });
  }, []);

  return null;
}
