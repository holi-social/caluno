import type { User } from '@repo/data';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui';

type MemberProps = {
  member: User;
};

export const UserCard = ({ member }: MemberProps) => (
  <div className="flex items-center gap-2">
    <Avatar size="sm" className="bg-muted">
      <AvatarImage src={member.image} alt="" />
      <AvatarFallback>XX</AvatarFallback>
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
