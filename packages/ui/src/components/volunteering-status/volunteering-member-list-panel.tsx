'use client';

import { Search } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';

import { cn } from '../../lib/utils';
import { Badge } from '../base/badge';
import { Input } from '../input';
import type {
  ShiftVolunteeringDisplayState,
  ShiftVolunteeringPhase,
} from './types';
import { VolunteeringMemberRow } from './volunteering-member-row';

export type VolunteeringMemberListItem = {
  id: string;
  name: string;
  email?: string;
  state: ShiftVolunteeringDisplayState;
  completedDuration?: string;
};

export type VolunteeringMemberListPanelProps = {
  title: string;
  members: VolunteeringMemberListItem[];
  phase?: ShiftVolunteeringPhase;
  searchPlaceholder?: string;
  emptyMessage?: string;
  renderTrailing?: (member: VolunteeringMemberListItem) => ReactNode;
  className?: string;
};

/** Bordered panel with header count, search, and status member rows. */
export function VolunteeringMemberListPanel({
  title,
  members,
  phase,
  searchPlaceholder = 'Search name or email…',
  emptyMessage = 'No matches.',
  renderTrailing,
  className,
}: VolunteeringMemberListPanelProps) {
  const [query, setQuery] = useState('');

  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return members;

    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(normalized) ||
        member.email?.toLowerCase().includes(normalized),
    );
  }, [members, query]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        <Badge variant="outline">{members.length}</Badge>
      </div>

      <div className="flex min-h-0 flex-col overflow-hidden rounded-md border shadow-xs">
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="max-h-64 overflow-y-auto p-1">
          {filteredMembers.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            filteredMembers.map((member) => (
              <VolunteeringMemberRow
                key={member.id}
                name={member.name}
                email={member.email}
                state={member.state}
                phase={phase}
                completedDuration={member.completedDuration}
                trailing={renderTrailing?.(member)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
