import { accountingRelations } from '../accounting/schemas/accounting.relations';
import { authRelations } from '../auth/schemas/auth.relations';
import { eventsRelations } from '../event/schemas/event.relations';
import { eventInvitesRelations } from '../event/schemas/event-invite.relations';
import { membershipRelations } from '../membership/schemas/membership.relations';
import { membershipRequestRelations } from '../membership/schemas/membership-request.relations';
import { organizationRelations } from '../organization/schemas/organization.relations';
import { requirementProfilesRelations } from '../requirement-profile/schemas/requirement-profiles.relations';
import { shiftsRelations } from '../shift/schemas/shift.relations';
import { shiftCallOutRecipientsRelations } from '../shift/schemas/shift-call-out-recipient.relations';
import { shiftInstancesRelations } from '../shift/schemas/shift-instance.relations';
import { shiftInstanceInvitesRelations } from '../shift/schemas/shift-instance-invite.relations';
import { shiftInstanceUnderstaffedStatesRelations } from '../shift/schemas/shift-instance-understaffed-state.relations';
import { shiftInvitesRelations } from '../shift/schemas/shift-invite.relations';
import { shiftManagerNotificationsRelations } from '../shift/schemas/shift-manager-notification.relations';
import { filesRelations } from '../storage/schemas/file.relations';
import { timeEntryRelations } from '../time-tracking/schemas/time-entry.relations';

export const relations = {
  ...accountingRelations,
  ...authRelations,
  ...eventsRelations,
  ...eventInvitesRelations,
  ...filesRelations,
  ...membershipRelations,
  ...membershipRequestRelations,
  ...organizationRelations,
  ...requirementProfilesRelations,
  ...shiftsRelations,
  ...shiftCallOutRecipientsRelations,
  ...shiftInstancesRelations,
  ...shiftInstanceInvitesRelations,
  ...shiftInstanceUnderstaffedStatesRelations,
  ...shiftInvitesRelations,
  ...shiftManagerNotificationsRelations,
  ...timeEntryRelations,
};
