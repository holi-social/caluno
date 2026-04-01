import { authRelations } from '../auth/schemas/auth.relations';
import { membershipRelations } from '../membership/schemas/membership.relations';
import { membershipRequestRelations } from '../membership/schemas/membership-request.relations';
import { organizationRelations } from '../organization/schemas/organization.relations';
import { requirementProfilesRelations } from '../requirement-profile/schemas/requirement-profiles.relations';
import { shiftRelations } from '../shift/schemas/shift.relations';
import { shiftInviteRelations } from '../shift/schemas/shift-invite.relations';
import { timeEntryRelations } from '../time-tracking/schemas/time-entry.relations';

export const relations = {
  ...authRelations,
  ...membershipRelations,
  ...membershipRequestRelations,
  ...organizationRelations,
  ...requirementProfilesRelations,
  ...shiftRelations,
  ...shiftInviteRelations,
  ...timeEntryRelations,
};
