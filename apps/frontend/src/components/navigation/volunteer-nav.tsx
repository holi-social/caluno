'use client';

import { TabBar, type TabBarIsland, type TabBarItem } from '@repo/ui';
import {
  Building2Icon,
  CalendarIcon,
  FileClockIcon,
  QrCodeIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';

type VolunteerNavProps = {
  isAdmin: boolean;
};

export function VolunteerNav({ isAdmin }: VolunteerNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Navigation');

  const volunteerTabs: TabBarItem[] = useMemo(
    () => [
      { label: t('shifts'), icon: CalendarIcon, key: '/' },
      { label: t('checkIn'), icon: QrCodeIcon, key: '/qr-id' },
      { label: t('myTime'), icon: FileClockIcon, key: '/timesheets' },
    ],
    [t],
  );

  const adminMenuItem: TabBarIsland | undefined = isAdmin
    ? {
        side: 'right',
        icon: Building2Icon,
        label: t('admin'),
        onClick: () => {
          router.push('/admin');
        },
      }
    : undefined;

  const activeKey = useMemo(() => {
    if (
      pathname === '/' ||
      pathname.startsWith('/discover') ||
      pathname.startsWith('/my-shifts') ||
      pathname.startsWith('/my-events') ||
      pathname.startsWith('/shifts')
    ) {
      return '/';
    }
    return pathname;
  }, [pathname]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
      <TabBar
        items={volunteerTabs}
        onSelect={router.push}
        activeKey={activeKey}
        className="pointer-events-auto w-full max-w-xl"
        island={adminMenuItem}
      />
    </div>
  );
}
