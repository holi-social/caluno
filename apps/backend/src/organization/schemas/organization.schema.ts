import { relations } from 'drizzle-orm';
import {
    index,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core';

import { users } from '../../auth/schemas/auth.schema';
import { memberships } from '../../membership/schemas/membership.schema';
import { opportunities } from '../../opportunity/schemas/opportunity.schema';
import { OrganizationRole } from '../models/organization.model';

export const organizationRoleEnum = pgEnum(
    'organization_role',
    OrganizationRole as Record<string, string>,
);

export const organizations = pgTable(
    'organizations',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        parentId: uuid('parent_id').references((): any => organizations.id, {
            onDelete: 'cascade',
        }),
        name: text('name').notNull(),
        slug: text('slug').notNull().unique(),
        logoUrl: text('logo_url'),
        websiteUrl: text('website_url'),
        email: text('email'),
        phone: text('phone'),
        description: text('description'),
        address: text('address'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at')
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
        deletedAt: timestamp('deleted_at'),
        ownerId: text('owner_id')
            .notNull()
            .references(() => users.id, { onDelete: 'restrict' }),
    },
    (table) => [
        index('idx_organizations_parent_id').on(table.parentId),
        index('idx_organizations_owner_id').on(table.ownerId),
        index('idx_organizations_name').on(table.name),
        index('idx_organizations_deleted_at').on(table.deletedAt),
    ],
);

export const organizationRelations = relations(
    organizations,
    ({ one, many }) => ({
        parent: one(organizations, {
            fields: [organizations.parentId],
            references: [organizations.id],
            relationName: 'parentChild',
        }),
        children: many(organizations, {
            relationName: 'parentChild',
        }),
        owner: one(users, {
            fields: [organizations.ownerId],
            references: [users.id],
        }),
        opportunities: many(opportunities),
        memberships: many(memberships),
    }),
);

export type OrganizationEntity = typeof organizations.$inferSelect;
export type OrganizationInsert = typeof organizations.$inferInsert;
