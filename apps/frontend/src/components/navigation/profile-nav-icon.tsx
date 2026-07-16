'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui';
import { UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface ProfileNavIconProps {
  orgUId: string;
  imageUrl?: string | null;
  name?: string | null;
}

export function ProfileNavIcon({
  orgUId,
  imageUrl,
  name,
}: ProfileNavIconProps) {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');

  return (
    <Link
      href={`/admin/${orgUId}/profile`}
      aria-label={t('title')}
      className="inline-flex size-11 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1"
    >
      <Avatar size="sm">
        <AvatarImage
          src={imageUrl ?? undefined}
          alt={name ? tCommon('avatarAlt', { name }) : t('title')}
        />
        <AvatarFallback>
          <UserIcon className="size-4" />
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
