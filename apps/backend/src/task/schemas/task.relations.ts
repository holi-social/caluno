import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const taskRelations = defineRelationsPart(schema, (r) => ({
  tasks: {
    project: r.one.projects({
      from: r.tasks.projectId,
      to: r.projects.id,
    }),
    createdBy: r.one.users({
      from: r.tasks.createdById,
      to: r.users.id,
    }),
    assignments: r.many.taskAssignments({
      from: r.tasks.id,
      to: r.taskAssignments.taskId,
    }),
  },
}));
