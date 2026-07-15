'use client';

import { useEffect, useState } from 'react';

const DEFAULT_MIN_DELAY_MS = 300;

export function useDelayedLoading(
  isLoading: boolean,
  minDelayMs = DEFAULT_MIN_DELAY_MS,
): boolean {
  const [showLoading, setShowLoading] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowLoading(false);
    }, minDelayMs);

    return () => window.clearTimeout(timeout);
  }, [isLoading, minDelayMs]);

  return showLoading;
}
