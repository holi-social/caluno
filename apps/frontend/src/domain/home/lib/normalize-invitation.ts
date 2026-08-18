import { tz } from '@date-fns/tz';
import { isSameDay } from 'date-fns';
import { shiftPublicPath } from '@/domain/shift/share';
import { DEFAULT_TIMEZONE } from '@/lib/formatting/formats';
import type { MergedInvitation } from './merge-invitations';

export interface NormalizedInvite {
  kind: 'shift' | 'event';
  id: string;
  detailHref: string;
  title: string;
  location: string | null;
  orgName: string;
  orgLogoUrl: string | null;
  invitedAt: string | null;
  startsAt: string;
  endsAt: string;
  isMultiDay: boolean;
  rrule: string | null;
}

export function normalizeInvitation(
  invite: MergedInvitation,
): NormalizedInvite {
  if (invite.kind === 'shift') {
    const { shift } = invite;
    return {
      kind: 'shift',
      id: shift.id,
      detailHref: shiftPublicPath(shift.master.id, shift.id),
      title: shift.master.title,
      location: shift.master.location ?? null,
      orgName: shift.master.organizationUnit.name,
      orgLogoUrl: shift.master.organizationUnit.logoUrl ?? null,
      invitedAt: shift.myInvitedAt ?? null,
      startsAt: shift.actualStartsAt,
      endsAt: shift.actualEndsAt,
      isMultiDay: false,
      rrule: shift.master.rrule ?? null,
    };
  }

  const { event } = invite;
  return {
    kind: 'event',
    id: event.id,
    detailHref: `/events/${event.id}`,
    title: event.title,
    location: event.location ?? null,
    orgName: event.organizationUnit!.name,
    orgLogoUrl: event.organizationUnit!.logoUrl ?? null,
    invitedAt: event.myInvitedAt ?? null,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    isMultiDay: !isSameDay(new Date(event.startsAt), new Date(event.endsAt), {
      in: tz(DEFAULT_TIMEZONE),
    }),
    rrule: null,
  };
}
