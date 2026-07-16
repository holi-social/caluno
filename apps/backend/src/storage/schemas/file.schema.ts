import {
  index,
  integer,
  pgEnum,
  snakeCase,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';
import { FilePurpose, FileStatus, FileVisibility } from '../enums';

export const fileVisibilityEnum = pgEnum('file_visibility', [
  FileVisibility.PRIVATE,
  FileVisibility.PUBLIC,
]);

export const filePurposeEnum = pgEnum('file_purpose', [
  FilePurpose.REQUIREMENT_DOCUMENT,
  FilePurpose.FORM_DOCUMENT,
  FilePurpose.ORG_LOGO,
  FilePurpose.ORGANIZATION_LOGO,
  FilePurpose.EVENT_IMAGE,
  FilePurpose.SHIFT_IMAGE,
  FilePurpose.PROFILE_PICTURE,
]);

export const fileStatusEnum = pgEnum('file_status', [
  FileStatus.PENDING,
  FileStatus.UPLOADED,
  FileStatus.FAILED,
]);

export const files = snakeCase.table(
  'files',
  {
    ...idColumn,
    storageKey: text('storage_key').notNull().unique(),
    bucket: text('bucket').notNull(),
    visibility: fileVisibilityEnum('visibility').notNull(),
    purpose: filePurposeEnum('purpose').notNull(),
    mimeType: text('mime_type').notNull(),
    filename: text('filename').notNull(),
    byteSize: integer('byte_size'),
    status: fileStatusEnum('status').notNull().default(FileStatus.PENDING),
    uploadedByUserId: text('uploaded_by_user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    organizationUnitId: uuid('organization_unit_id').references(
      () => organizationUnits.id,
      { onDelete: 'set null' },
    ),
    publicUrl: text('public_url'),
    uploadedAt: timestamp('uploaded_at'),
    ...timestampColumns,
  },
  (table) => [
    index('idx_files_uploaded_by_user_id').on(table.uploadedByUserId),
    index('idx_files_organization_unit_id').on(table.organizationUnitId),
    index('idx_files_status').on(table.status),
  ],
);

export type FileEntity = typeof files.$inferSelect;
export type FileInsert = typeof files.$inferInsert;
