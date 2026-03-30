'use client';

import type { GetVolunteersQuery } from '@repo/data';
import {
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
import { UserCard } from '@/components/user-card';
import { getVolunteers } from '@/domain/organization/actions';

type Volunteer = NonNullable<
  GetVolunteersQuery['organization']['volunteers']
>[number];

interface InviteListProps {
  organizationUnitId: string;
  value: string[] | undefined;
  onChange: (ids: string[]) => void;
}

const filterUsers = (users: Volunteer[], query: string) =>
  users.filter(
    (v) =>
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      v.email.toLowerCase().includes(query.toLowerCase()),
  );

export const InviteList = ({
  organizationUnitId,
  value = [],
  onChange,
}: InviteListProps) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [volunteerSearchQuery, setVolunteerSearchQuery] = useState('');
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');

  useEffect(() => {
    getVolunteers(organizationUnitId).then((vol) =>
      vol ? setVolunteers(vol) : setVolunteers([]),
    );
  }, [organizationUnitId]);

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
                className="w-full rounded-md p-2 hover:bg-muted/50 transition-colors"
              >
                <UserCard user={volunteer} size="sm" />
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
                className="w-full flex justify-between rounded-md p-2 pr-0 hover:bg-muted/50 transition-colors"
              >
                <UserCard user={volunteer} size="sm" />
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
};
