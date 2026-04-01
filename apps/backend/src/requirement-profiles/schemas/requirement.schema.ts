import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizations } from '../../organization/schemas/organization.schema';
import { RequirementType } from '../enums';

export const requirementTypeEnum = pgEnum(
  'requirement_type',
  RequirementType as Record<string, string>,
);

export const requirements = pgTable(
  'requirements',
  {
    ...idColumn,
    organizationId: uuid('organization_id')
      .references(() => organizations.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    type: requirementTypeEnum('type').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    mandatory: boolean('mandatory').notNull().default(false),
    ...timestampColumns,
  },
  (table) => [
    index('idx_requirements_organization_id').on(table.organizationId),
  ],
);

export type RequirementEntity = typeof requirements.$inferSelect;
export type RequirementInsert = typeof requirements.$inferInsert;
