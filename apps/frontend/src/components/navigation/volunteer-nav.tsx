'use client';

import { TabBar, type TabBarItem } from '@repo/ui';
import {
  Building2Icon,
  FileClockIcon,
  HomeIcon,
  QrCodeIcon,
} from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';

const volunteerTabs: TabBarItem[] = [
  { label: 'Home', icon: HomeIcon, key: '/' },
  { label: 'Check in', icon: QrCodeIcon, key: '/qr-id' },
  { label: 'My Time', icon: FileClockIcon, key: '/timesheets' },
];

export function VolunteerNav() {
  const pathname = usePathname();
  const router = useRouter();

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
          label: 'Admin',
          onClick: () => {
            router.push('/admin');
          },
        }}
      />
    </div>
  );
}
