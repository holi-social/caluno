import { authRelations } from '../auth/schemas/auth.relations';
import { membershipRelations } from '../membership/schemas/membership.relations';
import { organizationRelations } from '../organization/schemas/organization.relations';
import { projectRelations } from '../project/schemas/project.relations';
import { shiftRelations } from '../shift/schemas/shift.relations';
import { shiftInviteRelations } from '../shift/schemas/shift-invite.relations';
import { taskRelations } from '../task/schemas/task.relations';
import { taskAssignmentRelations } from '../task/schemas/task-assignment.relations';
import { timeEntryRelations } from '../time-tracking/schemas/time-entry.relations';
import { volunteerSessionRelations } from '../time-tracking/schemas/volunteer-sessions.relation';

export const relations = {
  ...authRelations,
  ...membershipRelations,
  ...organizationRelations,
  ...projectRelations,
  ...shiftRelations,
  ...shiftInviteRelations,
  ...taskRelations,
  ...taskAssignmentRelations,
  ...timeEntryRelations,
  ...volunteerSessionRelations,
};
