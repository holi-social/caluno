'use client';

import { TabBar, type TabBarItem } from '@repo/ui';
import {
  Building2Icon,
  FileClockIcon,
  HomeIcon,
  QrCodeIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';

export function VolunteerNav() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Navigation');

  const volunteerTabs: TabBarItem[] = useMemo(
    () => [
      { label: t('home'), icon: HomeIcon, key: '/' },
      { label: t('checkIn'), icon: QrCodeIcon, key: '/qr-id' },
      { label: t('myTime'), icon: FileClockIcon, key: '/timesheets' },
    ],
    [t],
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pb-[calc(0.25rem+env(safe-area-inset-bottom))] flex justify-center">
      <TabBar
        items={volunteerTabs}
        onSelect={router.push}
        activeKey={pathname}
        className="w-full max-w-xl"
        island={{
          side: 'right',
          icon: Building2Icon,
          label: t('admin'),
          onClick: () => {
            router.push('/admin');
          },
        }}
      />
    </div>
  );
}
