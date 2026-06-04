'use client';

import { ClockIcon, HomeIcon, QrCodeIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { NavItem } from './nav-item';

export function VolunteerNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed shrink bottom-0 left-0 right-0 z-50 border-t bg-background px-3 py-2 ">
      <div className="container mx-auto flex items-center justify-around gap-2 max-w-4xl">
        <NavItem
          href={'/'}
          icon={HomeIcon}
          label="Home"
          active={pathname === '/'}
        />
        <NavItem
          href={'/qr-id'}
          icon={QrCodeIcon}
          label="QR iD"
          active={pathname === '/qr-id'}
        />
        <NavItem
          href={'/timesheets'}
          icon={ClockIcon}
          label="My Time"
          active={pathname === '/timesheets'}
        />
      </div>
    </nav>
  );
}
