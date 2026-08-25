import type { User } from '@repo/data';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { getInitials } from '@/lib/get-initials';

type UserCardProps = {
  user: Pick<User, 'name' | 'image'> & { email?: string | null };
  size?: 'sm' | 'lg' | 'default';
  hideEmail?: boolean;
};

export const UserCard = ({
  user,
  size = 'default',
  hideEmail = false,
}: UserCardProps) => {
  const t = useTranslations('Common');

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex gap-2 min-w-0">
        <Avatar size={size} className="bg-muted">
          <AvatarImage
            src={user.image ?? ''}
            alt={t('avatarAlt', { name: user.name })}
          />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="overflow-hidden">
          <div className="font-medium text-left text-sm truncate">
            {user.name}
          </div>
          {!hideEmail && (
            <div className="text-xs text-left text-muted-foreground truncate">
              {user.email}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
