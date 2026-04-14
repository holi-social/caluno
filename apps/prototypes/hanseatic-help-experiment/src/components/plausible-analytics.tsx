'use client';

import { useEffect } from 'react';

import { ensurePlausibleInitialized, getPlausibleDomain } from '@/lib/plausible-init';

export function PlausibleAnalytics() {
  useEffect(() => {
    if (!getPlausibleDomain()) return;
    void ensurePlausibleInitialized();
  }, []);

  return null;
}
