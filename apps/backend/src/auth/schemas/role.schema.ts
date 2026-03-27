import { boolean, index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizations } from '../../organization/schemas/organization.schema';

export const roles = pgTable(
  'roles',
  {
    ...idColumn,
    name: text('name').notNull(),
    description: text('description'),
    isInternal: boolean('is_internal').notNull().default(false),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    ...timestampColumns,
  },
  (table) => [
    index('idx_roles_name').on(table.name),
    index('idx_roles_organization_id').on(table.organizationId),
  ],
);

export type RoleEntity = typeof roles.$inferSelect;
export type RoleInsert = typeof roles.$inferInsert;
