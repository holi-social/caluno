import { EventInviteStatus } from '@repo/data';
import type { ShiftVolunteeringDisplayState } from '@repo/ui';

/** Events surface invited vs joined (follow); awaiting maps to invited. */
export function toEventInviteDisplayState(
  status: EventInviteStatus,
): Extract<ShiftVolunteeringDisplayState, 'invited' | 'signed_up'> {
  if (status === EventInviteStatus.Joined) {
    return 'signed_up';
  }
  return 'invited';
}
