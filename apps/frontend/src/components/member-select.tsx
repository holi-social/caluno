import {
  Badge,
  Button,
  Card,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@repo/ui';
import { ArrowRightLeft, CircleX, Link2, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { copyToClipboard } from '@/lib/clipboard';
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
  readonlyIds?: string[];
  inviteLinkUrl?: string;
};

export const MemberSelect = ({
  members = [],
  value: selectedMemberIds = [],
  onChange,
  readonlyIds = [],
  inviteLinkUrl,
}: MemberSelectProps) => {
  const t = useTranslations('MemberSelect');
  const effectiveSelectedIds = [
    ...new Set([...selectedMemberIds, ...readonlyIds]),
  ];
  const availableMembers = members.filter(
    (v) => !effectiveSelectedIds.includes(v.id),
  );
  const selectedMembers = members.filter((v) =>
    effectiveSelectedIds.includes(v.id),
  );

  const addMember = (memberId: string) => {
    onChange([...selectedMemberIds, memberId]);
  };

  const removeMember = (memberId: string) => {
    if (readonlyIds.includes(memberId)) return;
    onChange(selectedMemberIds.filter((id) => id !== memberId));
  };

  const handleCopyLink = () => {
    if (inviteLinkUrl) {
      copyToClipboard(inviteLinkUrl, t('copyToast'));
    }
  };

  return (
    <div className="flex gap-4 items-center">
      <FilteredMemberList
        title={t('availableLabel')}
        members={availableMembers}
        emptyMessage={t('allSelected')}
        className="min-w-0 flex-1"
        inviteLinkUrl={inviteLinkUrl}
        onInviteByLink={handleCopyLink}
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
        title={t('invitedLabel')}
        className="min-w-0 flex-1"
        members={selectedMembers}
        renderItem={(member) => (
          <div className="w-full flex justify-between p-1">
            <UserCard user={member} size="sm" />
            {!readonlyIds.includes(member.id) && (
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => removeMember(member.id)}
              >
                <CircleX />
              </Button>
            )}
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
  inviteLinkUrl?: string;
  onInviteByLink?: () => void;
};

export const FilteredMemberList = ({
  title,
  members,
  emptyMessage,
  renderItem,
  className,
  inviteLinkUrl,
  onInviteByLink,
}: FilteredMemberListProps) => {
  const t = useTranslations('MemberSelect');
  const [searchQuery, setSearchQuery] = useState('');
  const membersFiltered = filterUsers(members, searchQuery);

  const showInviteLink = inviteLinkUrl && membersFiltered.length === 0;

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
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <Search className="text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>

        <div className="space-y-1 overflow-y-auto p-2">
          {membersFiltered.length === 0 ? (
            <div className="space-y-2 p-2">
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? t('noResults')
                  : (emptyMessage ?? t('allSelected'))}
              </p>
              {showInviteLink && onInviteByLink && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onInviteByLink}
                >
                  <Link2 />
                  {t('inviteByLink')}
                </Button>
              )}
            </div>
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
