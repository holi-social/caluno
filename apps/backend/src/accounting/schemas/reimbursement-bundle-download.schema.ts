import {
  snakeCase,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { reimbursementTypes } from './reimbursement-type.schema';

export const reimbursementBundleDownloads = snakeCase.table(
  'reimbursement_bundle_downloads',
  {
    ...idColumn,
    volunteerId: text('volunteer_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    reimbursementTypeId: uuid('reimbursement_type_id')
      .references(() => reimbursementTypes.id, { onDelete: 'restrict' })
      .notNull(),
    downloadedAt: timestamp('downloaded_at').notNull(),
    downloadedByUserId: text('downloaded_by_user_id').references(
      () => users.id,
      {
        onDelete: 'set null',
      },
    ),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex('uq_reimbursement_bundle_downloads_volunteer_type').on(
      table.volunteerId,
      table.reimbursementTypeId,
    ),
  ],
);

export type ReimbursementBundleDownloadEntity =
  typeof reimbursementBundleDownloads.$inferSelect;
export type ReimbursementBundleDownloadInsert =
  typeof reimbursementBundleDownloads.$inferInsert;
