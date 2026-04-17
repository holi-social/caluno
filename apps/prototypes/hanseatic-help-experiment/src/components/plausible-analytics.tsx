'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { ensurePlausibleInitialized, getPlausibleDomain } from '@/lib/plausible-init';

export function PlausibleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const lastTrackedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!getPlausibleDomain() || typeof window === 'undefined') return;

    const currentUrl = window.location.href;
    if (lastTrackedUrlRef.current === currentUrl) return;
    lastTrackedUrlRef.current = currentUrl;

    void (async () => {
      await ensurePlausibleInitialized();
      const { track } = await import('@plausible-analytics/tracker');
      // Send the full URL so UTM query params are available for attribution.
      track('pageview', { url: currentUrl });
    })();
  }, [pathname, searchParamsKey]);

  return null;
}
