import { sql } from 'drizzle-orm';
import { check, integer, pgEnum, snakeCase, uuid } from 'drizzle-orm/pg-core';
import { permissions } from '../../auth/schemas/permission.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { enumValues } from '../../database/typeutil';
import { SigneeType } from '../enums';
import { documentTemplates } from './document-template.schema';

export const signeeTypeEnum = pgEnum('signee_type', enumValues(SigneeType));

export const templateSignees = snakeCase.table(
  'template_signees',
  {
    ...idColumn,
    documentTemplateId: uuid('document_template_id')
      .references(() => documentTemplates.id, { onDelete: 'cascade' })
      .notNull(),
    order: integer('order').notNull(),
    signeeType: signeeTypeEnum('signee_type').$type<SigneeType>().notNull(),
    requiredPermissionId: uuid('required_permission_id').references(
      () => permissions.id,
      { onDelete: 'restrict' },
    ),
    ...timestampColumns,
  },
  (table) => [
    check(
      'chk_template_signees_required_permission_matches_signee_type',
      sql`(${table.signeeType} = 'PERMISSION_HOLDER' AND ${table.requiredPermissionId} IS NOT NULL) OR (${table.signeeType} = 'VOLUNTEER' AND ${table.requiredPermissionId} IS NULL)`,
    ),
  ],
);

export type TemplateSigneeEntity = typeof templateSignees.$inferSelect;
export type TemplateSigneeInsert = typeof templateSignees.$inferInsert;
