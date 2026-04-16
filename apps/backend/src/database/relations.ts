import { authRelations } from '../auth/schemas/auth.relations';
import { membershipRelations } from '../membership/schemas/membership.relations';
import { membershipRequestRelations } from '../membership/schemas/membership-request.relations';
import { organizationRelations } from '../organization/schemas/organization.relations';
import { requirementProfilesRelations } from '../requirement-profile/schemas/requirement-profiles.relations';
import { shiftsRelations } from '../shift/schemas/shift.relations';
import { shiftInstancesRelations } from '../shift/schemas/shift-instance.relations';
import { shiftInstanceInvitesRelations } from '../shift/schemas/shift-instance-invite.relations';
import { timeEntryRelations } from '../time-tracking/schemas/time-entry.relations';

export const relations = {
  ...authRelations,
  ...membershipRelations,
  ...membershipRequestRelations,
  ...organizationRelations,
  ...requirementProfilesRelations,
  ...shiftsRelations,
  ...shiftInstancesRelations,
  ...shiftInstanceInvitesRelations,
  ...timeEntryRelations,
};
