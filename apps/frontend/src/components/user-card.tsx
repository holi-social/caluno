import type { User } from '@repo/data';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui';

type UserCardProps = {
  user: Pick<User, 'name' | 'image' | 'email'>;
  size?: 'sm' | 'lg' | 'default';
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

export const UserCard = ({ user, size = 'default' }: UserCardProps) => (
  <div className="flex items-center gap-2">
    <Avatar size={size} className="bg-muted">
      <AvatarImage src={user.image ?? ''} alt="" />
      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
    </Avatar>
    <div>
      <div className="font-medium text-left text-sm truncate">{user.name}</div>
      <div className="text-xs text-left text-muted-foreground truncate">
        {user.email}
      </div>
    </div>
  </div>
);
