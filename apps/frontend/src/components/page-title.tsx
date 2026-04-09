'use client';

import { usePathname } from 'next/navigation';
import { menuItems } from '@/components/home-sidebar';

export function PageTitle() {
  const pathname = usePathname();
  const title =
    menuItems.find((item) => item.href === pathname)?.title ?? 'Clippy';

  return <h2 className="text-lg font-semibold">{title}</h2>;
}
