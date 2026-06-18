'use client';

import { UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function ProfileNavIcon() {
  const t = useTranslations('Profile');

  return (
    <Link
      href="/volunteering/profile"
      aria-label={t('title')}
      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent"
    >
      <UserIcon className="size-5" />
    </Link>
  );
}
