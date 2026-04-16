import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizations } from '../../organization/schemas/organization.schema';
import { OrganizationUserProfileStatus } from '../enums';

export const organizationUserProfileStatusEnum = pgEnum(
  'organization_user_profile_status',
  OrganizationUserProfileStatus as Record<string, string>,
);

export const organizationUserProfiles = pgTable(
  'organization_user_profiles',
  {
    ...idColumn,
    organizationId: uuid('organization_id')
      .references(() => organizations.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    userId: text('user_id')
      .references(() => users.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    status: organizationUserProfileStatusEnum('status')
      .notNull()
      .default(OrganizationUserProfileStatus.PENDING),
    userProfileAccessApproved: boolean('user_profile_access_approved')
      .notNull()
      .default(false),
    note: text('note'),
    ...timestampColumns,
  },
  (table) => [
    index('idx_organization_user_profiles_organization_id').on(
      table.organizationId,
    ),
    index('idx_organization_user_profiles_user_id').on(table.userId),
  ],
);

export type OrganizationUserProfileEntity =
  typeof organizationUserProfiles.$inferSelect;
export type OrganizationUserProfileInsert =
  typeof organizationUserProfiles.$inferInsert;
