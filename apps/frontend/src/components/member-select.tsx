import {
  Badge,
  Button,
  Card,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@repo/ui';
import { ArrowRightLeft, CircleX, Search } from 'lucide-react';
import { useState } from 'react';
import { UserCard } from './user-card';

type Member = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

const filterUsers = (users: Member[], query: string) =>
  users.filter(
    (v) =>
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      v.email.toLowerCase().includes(query.toLowerCase()),
  );

type MemberSelectProps = {
  members?: Member[];
  value?: string[];
  onChange: (ids: string[]) => void;
};

export const MemberSelect = ({
  members = [],
  value = [],
  onChange,
}: MemberSelectProps) => {
  const availableMembers = members.filter((v) => !value.includes(v.id));
  const selectedMembers = members.filter((v) => value.includes(v.id));

  const addMember = (memberId: string) => {
    onChange([...value, memberId]);
  };

  const removeMember = (memberId: string) => {
    onChange(value.filter((id) => id !== memberId));
  };

  return (
    <div className="flex gap-4 items-center">
      <FilteredMemberList
        title="Available"
        members={availableMembers}
        emptyMessage="All members have been selected"
        className="min-w-0 flex-1"
        renderItem={(member) => (
          <button
            type="button"
            onClick={() => addMember(member.id)}
            className="w-full rounded-md p-1 hover:bg-muted/50 transition-colors"
          >
            <UserCard user={member} size="sm" />
          </button>
        )}
      />
      <ArrowRightLeft className="size-6 shrink-0" />
      <FilteredMemberList
        title="Invited"
        className="min-w-0 flex-1"
        members={selectedMembers}
        renderItem={(member) => (
          <div className="w-full flex justify-between p-1">
            <UserCard user={member} size="sm" />
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => removeMember(member.id)}
            >
              <CircleX />
            </Button>
          </div>
        )}
      />
    </div>
  );
};

type FilteredMemberListProps = {
  title: string;
  members: Member[];
  emptyMessage?: string;
  renderItem: (member: Member) => React.ReactNode;
  className?: string;
};

export const FilteredMemberList = ({
  title,
  members,
  emptyMessage,
  renderItem,
  className,
}: FilteredMemberListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const membersFiltered = filterUsers(members, searchQuery);

  return (
    <div className={className}>
      <div className="flex justify-between mb-2">
        <FieldLabel htmlFor="searchInput">{title}</FieldLabel>
        <Badge variant="outline">{members.length}</Badge>
      </div>
      <Card className="p-0 gap-1 h-80 rounded-md shadow-xs">
        <InputGroup className="rounded-md rounded-b-none -m-px w-[calc(100%+2px)] shadow-xs">
          <InputGroupInput
            id="searchInput"
            placeholder="Search name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <Search className="text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>

        <div className="space-y-1 overflow-y-auto p-2">
          {membersFiltered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">
              {searchQuery ? 'No members found' : emptyMessage}
            </p>
          ) : (
            membersFiltered.map((member) => (
              <div key={member.id}>{renderItem(member)}</div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
