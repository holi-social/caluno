import { pgEnum } from 'drizzle-orm/pg-core';
import { enumValues } from '../database/typeutil';
import { EventInviteStatus } from '../event/enums';
import { ShiftInviteStatus } from '../shift/enums';
import { InviteOrigin } from './invite-enums';

export const inviteOriginEnum = pgEnum(
  'invite_origin',
  enumValues(InviteOrigin),
);

export const shiftInviteStatusEnum = pgEnum(
  'shift_invite_status',
  enumValues(ShiftInviteStatus),
);

export const eventInviteStatusEnum = pgEnum(
  'event_invite_status',
  enumValues(EventInviteStatus),
);
