import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const taskAssignmentRelations = defineRelationsPart(schema, (r) => ({
  taskAssignments: {
    task: r.one.tasks({
      from: r.taskAssignments.taskId,
      to: r.tasks.id,
    }),
    assignedTo: r.one.users({
      from: r.taskAssignments.assignedToId,
      to: r.users.id,
    }),
    assignedBy: r.one.users({
      from: r.taskAssignments.assignedById,
      to: r.users.id,
    }),
  },
}));
