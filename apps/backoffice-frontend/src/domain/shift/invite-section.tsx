'use client';

import type { User } from '@repo/data';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@repo/ui';
import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getVolunteers } from '../organization/actions';

interface InviteSectionProps {
  organizationId: string;
  value: string[] | undefined;
  onChange: (ids: string[]) => void;
}

type MemberProps = {
  member: User;
};

const Member = ({ member }: MemberProps) => (
  <div className="flex items-center gap-2">
    <Avatar size="sm" className="bg-muted">
      <AvatarImage src={member.image} alt="" />
      <AvatarFallback>XX</AvatarFallback>
    </Avatar>
    <div>
      <div className="font-medium text-sm truncate">{member.name}</div>
      <div className="text-xs text-muted-foreground truncate">
        {member.email}
      </div>
    </div>
  </div>
);

const filterUsers = (users: User[], query: string) =>
  users.filter(
    (v) =>
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      v.email.toLowerCase().includes(query.toLowerCase()),
  );

export function InviteSection({
  organizationId,
  value = [],
  onChange,
}: InviteSectionProps) {
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [volunteerSearchQuery, setVolunteerSearchQuery] = useState('');
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');

  useEffect(() => {
    getVolunteers(organizationId).then((vol) =>
      vol ? setVolunteers(vol) : setVolunteers([]),
    );
  }, [organizationId]);

  const availableVolunteers = volunteers.filter((v) => !value.includes(v.id));
  const filteredAvailable = filterUsers(
    availableVolunteers,
    volunteerSearchQuery,
  );

  const invitedVolunteers = volunteers.filter((v) => value.includes(v.id));
  const filteredInvites = filterUsers(invitedVolunteers, inviteSearchQuery);

  const addMember = (memberId: string) => {
    onChange([...value, memberId]);
  };

  const removeMember = (memberId: string) => {
    onChange(value.filter((id) => id !== memberId));
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-4 gap-4 h-80">
        <div className="flex justify-between">
          <FieldLabel htmlFor="volunteerSearchInput">Available</FieldLabel>
          <Badge variant="outline">{availableVolunteers.length}</Badge>
        </div>

        <InputGroup>
          <InputGroupInput
            id="volunteerSearchInput"
            placeholder="Search volunteers..."
            value={volunteerSearchQuery}
            onChange={(e) => setVolunteerSearchQuery(e.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <Search className="text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>

        <div className="space-y-2 overflow-y-auto">
          {filteredAvailable.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {volunteerSearchQuery
                ? 'No members found'
                : 'All members have been invited'}
            </p>
          ) : (
            filteredAvailable.map((volunteer) => (
              <button
                key={volunteer.id}
                type="button"
                onClick={() => addMember(volunteer.id)}
                className="w-full rounded-md p-2 text-left hover:bg-muted/50 transition-colors"
              >
                <Member member={volunteer} />
              </button>
            ))
          )}
        </div>
      </Card>
      <Card className="p-4 gap-4 h-80">
        <div className="flex justify-between">
          <FieldLabel htmlFor="inviteSearchInput">Invited</FieldLabel>
          <Badge variant="outline">{invitedVolunteers.length}</Badge>
        </div>
        <InputGroup>
          <InputGroupInput
            id="inviteSearchInput"
            placeholder="Search invited..."
            value={inviteSearchQuery}
            onChange={(e) => setInviteSearchQuery(e.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <Search className="text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>

        <div className="space-y-2 overflow-y-auto">
          {filteredInvites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {inviteSearchQuery && 'No members found'}
            </p>
          ) : (
            filteredInvites.map((volunteer) => (
              <div
                key={volunteer.id}
                className="w-full flex justify-between rounded-md p-2 pr-0 text-left hover:bg-muted/50 transition-colors"
              >
                <Member member={volunteer} />
                <div className="flex ">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => removeMember(volunteer.id)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
