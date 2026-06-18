'use client';

import { menuItems } from '@/components/navigation/home-sidebar';
import { usePathname } from '@/i18n/navigation';

export function PageTitle() {
  const pathname = usePathname();
  const title =
    menuItems.find((item) => item.href === pathname)?.title ?? 'Clippy';

  return <h2 className="text-lg font-semibold">{title}</h2>;
}
