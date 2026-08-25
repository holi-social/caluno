'use client';

import { Button, Popover, PopoverContent, PopoverTrigger } from '@repo/ui';
import { LogOutIcon, SettingsIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type PropsWithChildren, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { signOut } from '@/lib/auth';

type ProfileDropdownProps = PropsWithChildren & {};

export function ProfileDropdown({ children }: ProfileDropdownProps) {
  const t = useTranslations('Navigation');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleProfileOpen = async () => {
    setPopoverOpen(false);
    router.push('/profile');
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger className="rounded-full" asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-1">
        <Button
          variant="ghost"
          className="w-full justify-start px-2!"
          onClick={handleProfileOpen}
        >
          <SettingsIcon className="size-4 mr-2 " />
          {t('profile')}
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start px-2!"
          onClick={handleSignOut}
        >
          <LogOutIcon className="mr-2 size-4" />
          {tCommon('signOut')}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
