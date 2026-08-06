import { EventInviteStatus } from '@repo/data';
import type { ShiftVolunteeringDisplayState } from '@repo/ui';

/** Events only surface invited vs signed-up for now (accept + self-join). */
export function toEventInviteDisplayState(
  status: EventInviteStatus,
): Extract<ShiftVolunteeringDisplayState, 'invited' | 'signed_up'> {
  if (
    status === EventInviteStatus.Accepted ||
    status === EventInviteStatus.SelfJoined
  ) {
    return 'signed_up';
  }
  return 'invited';
}
