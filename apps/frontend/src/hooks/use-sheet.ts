'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

export function useSheetTrigger(name: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const open = useCallback(
    (params?: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set('sheet', name);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          next.set(k, v);
        }
      }
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, searchParams, name],
  );

  return {
    open,
  };
}

export function useSheet(name: string, extraKey?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { open } = useSheetTrigger(name);

  const isOpen = searchParams.get('sheet') === name;
  const [isPending, setIsPending] = useState(false);

  const getParam = useCallback(
    (key: string) => searchParams.get(key),
    [searchParams],
  );

  const close = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete('sheet');
    if (extraKey) next.delete(extraKey);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname, searchParams, extraKey]);

  return {
    isOpen,
    open,
    close,
    isPending,
    setIsPending,
    getParam,
  };
}
