import { registerEnumType } from '@nestjs/graphql';

// combines MembershipRequestStatus, EventInviteStatus, ShiftInviteStatus and Requirements
// Is used to answer about the join status between a user and an OrgUnit, Event or Shift.
export enum JoinStatus {
  NONE = 'NONE',
  JOINED = 'JOINED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  REQUIREMENTS_NEEDED = 'REQUIREMENTS_NEEDED',
  INVITED = 'INVITED',
  WAITLIST_JOINED = 'WAITLIST_JOINED',
  VOLUNTEER_REJECTED = 'VOLUNTEER_REJECTED',
}

registerEnumType(JoinStatus, {
  name: 'JoinStatus',
});
