'use client';

import { useMyDocumentSummary } from '@repo/data/react';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@repo/ui';
import { FileTextIcon, LogOutIcon, SettingsIcon } from 'lucide-react';
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
  const summary = useMyDocumentSummary();

  const handleProfileOpen = async () => {
    setPopoverOpen(false);
    router.push('/profile');
  };

  const handleDocumentsOpen = () => {
    setPopoverOpen(false);
    router.push('/profile/documents');
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const hasDocuments = (summary.data?.total ?? 0) > 0;
  const pendingCount = summary.data?.pending ?? 0;

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger className="rounded-full" asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        {hasDocuments && (
          <Button
            variant="ghost"
            className="w-full justify-start px-2!"
            onClick={handleDocumentsOpen}
          >
            <FileTextIcon className="size-4 mr-2" />
            <span className="flex-1 text-left">{t('myDocuments')}</span>
            {pendingCount > 0 && (
              <span
                role="img"
                aria-label={t('myDocumentsBadge', { count: pendingCount })}
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-white tabular-nums"
              >
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </Button>
        )}

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
