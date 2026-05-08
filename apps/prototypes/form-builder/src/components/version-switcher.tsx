'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@repo/ui';

export function VersionSwitcher() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const isV1 = pathname === '/v1' || pathname.startsWith('/v1/');
  const value = isV1 ? 'v1' : 'v2';

  function handleChange(next: string) {
    if (next === value) return;
    if (next === 'v1') {
      const target = pathname === '/' ? '/v1' : `/v1${pathname}`;
      router.push(target);
    } else {
      const stripped = pathname.replace(/^\/v1(?=\/|$)/, '');
      router.push(stripped || '/');
    }
  }

  return (
    <Tabs value={value} onValueChange={handleChange}>
      <TabsList>
        <TabsTrigger value="v1">v1</TabsTrigger>
        <TabsTrigger value="v2">v2</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
