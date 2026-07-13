import { authRelations } from '../auth/schemas/auth.relations';
import { eventsRelations } from '../event/schemas/event.relations';
import { eventInvitesRelations } from '../event/schemas/event-invite.relations';
import { membershipRelations } from '../membership/schemas/membership.relations';
import { membershipRequestRelations } from '../membership/schemas/membership-request.relations';
import { organizationRelations } from '../organization/schemas/organization.relations';
import { requirementProfilesRelations } from '../requirement-profile/schemas/requirement-profiles.relations';
import { shiftsRelations } from '../shift/schemas/shift.relations';
import { shiftInstancesRelations } from '../shift/schemas/shift-instance.relations';
import { shiftInstanceInvitesRelations } from '../shift/schemas/shift-instance-invite.relations';
import { shiftInvitesRelations } from '../shift/schemas/shift-invite.relations';
import { filesRelations } from '../storage/schemas/file.relations';
import { timeEntryRelations } from '../time-tracking/schemas/time-entry.relations';

export const relations = {
  ...authRelations,
  ...eventsRelations,
  ...eventInvitesRelations,
  ...filesRelations,
  ...membershipRelations,
  ...membershipRequestRelations,
  ...organizationRelations,
  ...requirementProfilesRelations,
  ...shiftsRelations,
  ...shiftInstancesRelations,
  ...shiftInstanceInvitesRelations,
  ...shiftInvitesRelations,
  ...timeEntryRelations,
};
