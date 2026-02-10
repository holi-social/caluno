import type { User } from '@repo/data';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui';

type MemberProps = {
  member: User;
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

export const UserCard = ({ member }: MemberProps) => (
  <div className="flex items-center gap-2">
    <Avatar size="sm" className="bg-muted">
      <AvatarImage src={member.image} alt="" />
      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
    </Avatar>
    <div>
      <div className="font-medium text-left text-sm truncate">
        {member.name}
      </div>
      <div className="text-xs text-left text-muted-foreground truncate">
        {member.email}
      </div>
    </div>
  </div>
);
