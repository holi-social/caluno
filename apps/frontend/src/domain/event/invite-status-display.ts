import type { EventInviteOrigin, EventInviteStatus } from '@repo/data';
import type { ShiftVolunteeringDisplayState } from '@repo/ui';
import {
  isParticipatingInvite,
  toInviteDisplayState,
} from '@/domain/shift/invite-status-display';

/** Events only surface invited vs signed-up for now. */
export function toEventInviteDisplayState(invite: {
  origin?: EventInviteOrigin | null;
  status?: EventInviteStatus | null;
}): Extract<ShiftVolunteeringDisplayState, 'invited' | 'signed_up'> {
  if (isParticipatingInvite(invite)) {
    return 'signed_up';
  }
  return toInviteDisplayState(invite) === 'signed_up' ? 'signed_up' : 'invited';
}
