import { relations } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from 'src/auth/schemas/auth.schema';
import { shifts } from './shift.schema';

export const shiftAssignments = pgTable(
  'shift_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shiftId: uuid('shift_id')
      .references(() => shifts.id, {
        onDelete: 'restrict',
      })
      .notNull(),
    userId: text('user_id')
      .references(() => users.id, {
        onDelete: 'restrict',
      })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_shift_assignments_shift_id').on(table.shiftId),
    index('idx_shift_assignments_user_id').on(table.userId),
    unique('uq_shift_assignments_shift_id_user_id').on(
      table.shiftId,
      table.userId,
    ),
  ],
);

export const shiftAssignmentsRelations = relations(
  shiftAssignments,
  ({ one }) => ({
    shift: one(shifts, {
      fields: [shiftAssignments.shiftId],
      references: [shifts.id],
    }),
    user: one(users, {
      fields: [shiftAssignments.userId],
      references: [users.id],
    }),
  }),
);
