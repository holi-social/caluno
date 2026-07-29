import { Avatar, AvatarFallback, AvatarImage, Button } from '@repo/ui';
import { Pencil } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getInitials } from '@/lib/get-initials';

type ProfileHeaderBlockProps = {
  name: string;
  imageUrl?: string | null;
};

export const ProfileHeaderBlock = async ({
  name,
  imageUrl,
}: ProfileHeaderBlockProps) => {
  const tCommon = await getTranslations('Common');
  const tProfile = await getTranslations('Profile');

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative size-20">
        <Avatar size="lg" className="size-20">
          <AvatarImage
            src={imageUrl ?? ''}
            alt={tCommon('avatarAlt', { name })}
          />
          <AvatarFallback className="text-2xl">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-disabled
          aria-label={tProfile('edit')}
          title={tProfile('edit')}
          className="absolute -bottom-1 -right-1 rounded-full bg-background"
        >
          <Pencil className="size-4" />
        </Button>
      </div>
      <h1 className="text-center text-xl font-bold">{name}</h1>
    </div>
  );
};
