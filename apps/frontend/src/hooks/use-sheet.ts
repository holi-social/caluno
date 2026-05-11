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

export function useSheet(name: string, ...extraKeys: string[]) {
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

  // join keys to use as a primitive in dependency array of useCallback
  const joinKey = ', ';
  const keysToDeleteJoined = extraKeys.join(joinKey);

  const close = useCallback(() => {
    const keysToDelete = keysToDeleteJoined.split(joinKey);
    const next = new URLSearchParams(searchParams.toString());

    next.delete('sheet');
    for (const key of keysToDelete) {
      next.delete(key);
    }

    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname, searchParams, keysToDeleteJoined]);

  return {
    isOpen,
    open,
    close,
    isPending,
    setIsPending,
    getParam,
  };
}
