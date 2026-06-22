'use client';

import { useTranslations } from 'next-intl';
import { menuItems } from '@/components/navigation/home-sidebar';
import { usePathname } from '@/i18n/navigation';

export function PageTitle() {
  const pathname = usePathname();
  const t = useTranslations('Navigation');
  const tCommon = useTranslations('Common');

  const titleKey = menuItems.find((item) => item.href === pathname)?.titleKey;
  const title = titleKey ? t(titleKey) : tCommon('brand');

  return <h2 className="text-lg font-semibold">{title}</h2>;
}
