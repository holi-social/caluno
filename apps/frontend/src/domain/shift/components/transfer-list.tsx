'use client';

import { Badge, Button, Input } from '@repo/ui';
import { ArrowLeftRight, CirclePlus, CircleX } from 'lucide-react';
import { useState } from 'react';

type Member = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

type TransferListProps = {
  available: Member[];
  invited: Member[];
  onInvitedChange: (ids: string[]) => void;
  readonlyIds?: string[];
};

export function TransferList({
  available,
  invited,
  onInvitedChange,
  readonlyIds = [],
}: TransferListProps) {
  const [availableSearch, setAvailableSearch] = useState('');
  const [invitedSearch, setInvitedSearch] = useState('');

  const invitedIds = new Set(invited.map((m) => m.id));
  const readonlySet = new Set(readonlyIds);

  const filteredAvailable = available.filter(
    (m) =>
      !invitedIds.has(m.id) &&
      (m.name.toLowerCase().includes(availableSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(availableSearch.toLowerCase())),
  );

  const filteredInvited = invited.filter(
    (m) =>
      m.name.toLowerCase().includes(invitedSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(invitedSearch.toLowerCase()),
  );

  const addMember = (member: Member) => {
    onInvitedChange([...invited.map((m) => m.id), member.id]);
  };

  const removeMember = (memberId: string) => {
    if (readonlySet.has(memberId)) return;
    onInvitedChange(invited.filter((m) => m.id !== memberId).map((m) => m.id));
  };

  return (
    <div className="flex gap-4 items-center h-[289px]">
      {/* Available panel */}
      <div className="flex flex-col gap-2 flex-1 h-full min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Available</span>
          <Badge variant="outline">{filteredAvailable.length}</Badge>
        </div>
        <div className="flex flex-col border rounded-md overflow-hidden flex-1 min-h-0 shadow-xs">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b">
            <Input
              placeholder="Name or email"
              value={availableSearch}
              onChange={(e) => setAvailableSearch(e.target.value)}
              className="border-0 shadow-none p-0 h-auto focus-visible:ring-0"
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {filteredAvailable.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent"
              >
                <div className="size-5 rounded-full bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.email}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => addMember(member)}
                  aria-label={`Add ${member.name}`}
                >
                  <CirclePlus className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ArrowLeftRight className="size-5 text-muted-foreground shrink-0" />

      {/* Invited panel */}
      <div className="flex flex-col gap-2 flex-1 h-full min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Invited</span>
          <Badge variant="outline">{invited.length}</Badge>
        </div>
        <div className="flex flex-col border rounded-md overflow-hidden flex-1 min-h-0 shadow-xs">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b">
            <Input
              placeholder="Name or email"
              value={invitedSearch}
              onChange={(e) => setInvitedSearch(e.target.value)}
              className="border-0 shadow-none p-0 h-auto focus-visible:ring-0"
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {filteredInvited.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent"
              >
                <div className="size-5 rounded-full bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.email}
                  </p>
                </div>
                {!readonlySet.has(member.id) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeMember(member.id)}
                    aria-label={`Remove ${member.name}`}
                  >
                    <CircleX className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
