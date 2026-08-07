import {
  ActionTooltip,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
} from '@repo/ui';
import { Pencil } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getInitials } from '@/lib/get-initials';
import { Link } from '../../../i18n/navigation';

type HeaderAvatarProps = {
  name: string;
  imageUrl?: string | null;
};

export const HeaderAvatar = async ({ name, imageUrl }: HeaderAvatarProps) => {
  const tCommon = await getTranslations('Common');
  const tProfile = await getTranslations('Profile');

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative size-20">
        <Avatar size="xl">
          <AvatarImage
            src={imageUrl ?? ''}
            alt={tCommon('avatarAlt', { name })}
          />
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <ActionTooltip label={tProfile('edit')}>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={tProfile('edit')}
            className="absolute -bottom-1 -right-1 rounded-full"
            asChild
          >
            <Link href={'/profile/avatar/edit'}>
              <Pencil className="size-4" />
            </Link>
          </Button>
        </ActionTooltip>
      </div>
      <h2 className="text-center text-lg font-bold">{name}</h2>
    </div>
  );
};
