import type { User } from '@repo/data';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui';

type UserCardProps = {
  user: Pick<User, 'name' | 'image'> & { email?: string | null };
  size?: 'sm' | 'lg' | 'default';
  hideEmail?: boolean;
};

const getInitials = (name?: string): string => {
  if (!name) return '?';

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
};

export const UserCard = ({
  user,
  size = 'default',
  hideEmail = false,
}: UserCardProps) => (
  <div className="flex gap-2 min-w-0">
    <Avatar size={size} className="bg-muted">
      <AvatarImage src={user.image ?? ''} alt="" />
      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
    </Avatar>
    <div className="overflow-hidden">
      <div className="font-medium text-left text-sm truncate">{user.name}</div>
      {!hideEmail && (
        <div className="text-xs text-left text-muted-foreground truncate">
          {user.email}
        </div>
      )}
    </div>
  </div>
);
