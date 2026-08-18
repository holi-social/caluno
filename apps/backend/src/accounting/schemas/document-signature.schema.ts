import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  snakeCase,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { permissions } from '../../auth/schemas/permission.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { SigneeType } from '../enums';
import { createdDocuments } from './created-document.schema';
import { signeeTypeEnum } from './template-signee.schema';

export const documentSignatures = snakeCase.table(
  'document_signatures',
  {
    ...idColumn,
    createdDocumentId: uuid('created_document_id')
      .references(() => createdDocuments.id, { onDelete: 'cascade' })
      .notNull(),
    order: integer('order').notNull(),
    signeeType: signeeTypeEnum('signee_type').$type<SigneeType>().notNull(),
    requiredPermissionId: uuid('required_permission_id').references(
      () => permissions.id,
      { onDelete: 'restrict' },
    ),
    signedByUserId: text('signed_by_user_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    signedAt: timestamp('signed_at'),
    ...timestampColumns,
  },
  (table) => [
    check(
      'chk_document_signatures_required_permission_matches_signee_type',
      sql`(${table.signeeType} = 'PERMISSION_HOLDER' AND ${table.requiredPermissionId} IS NOT NULL) OR (${table.signeeType} = 'VOLUNTEER' AND ${table.requiredPermissionId} IS NULL)`,
    ),
  ],
);

export type DocumentSignatureEntity = typeof documentSignatures.$inferSelect;
export type DocumentSignatureInsert = typeof documentSignatures.$inferInsert;
