import type { DocumentKind, SigneeType } from '../../src/accounting/enums';
import { ReimbursementTypeKey } from '../../src/accounting/enums';
import type { DocumentTemplateBody } from '../../src/accounting/schemas/document-template.schema';
import type { Database } from '../../src/database/database.module';
import * as schema from '../../src/database/schema';
import { createShift } from './shift.factory';
import { createShiftInstance } from './shift-instance.factory';

export type ReimbursementType = typeof schema.reimbursementTypes.$inferSelect;
export type DocumentTemplate = typeof schema.documentTemplates.$inferSelect;
export type TemplateSignee = typeof schema.templateSignees.$inferSelect;
export type TimeEntry = typeof schema.timeEntries.$inferSelect;

const EMPTY_BODY: DocumentTemplateBody = { header: {}, blocks: [], footer: {} };

/**
 * There are only ever two reimbursement type keys, so this upserts on `key`
 * instead of inserting - callers within the same test file share one row per
 * key, matching how this reference data actually behaves in production.
 */
export const createReimbursementType = async (
  db: Database,
  overrides?: Partial<typeof schema.reimbursementTypes.$inferInsert>,
): Promise<ReimbursementType> => {
  const values = {
    key: ReimbursementTypeKey.EHRENAMT,
    legalReference: '§3 Nr. 26a EStG',
    yearlyLimitCents: 84_000,
    platformDefaultRateCents: 1_500,
    ...overrides,
  };

  const [reimbursementType] = await db
    .insert(schema.reimbursementTypes)
    .values(values)
    .onConflictDoUpdate({
      target: schema.reimbursementTypes.key,
      set: {
        legalReference: values.legalReference,
        yearlyLimitCents: values.yearlyLimitCents,
        platformDefaultRateCents: values.platformDefaultRateCents,
      },
    })
    .returning();

  if (!reimbursementType) {
    throw new Error('Failed to create reimbursement type');
  }
  return reimbursementType;
};

export const createDocumentTemplate = async (
  db: Database,
  args: {
    organizationId: string;
    organizationUnitId?: string | null;
    reimbursementTypeId: string;
    kind: DocumentKind;
    signees: Array<{
      order: number;
      signeeType: SigneeType;
      requiredPermissionId?: string | null;
    }>;
    body?: DocumentTemplateBody;
  },
): Promise<DocumentTemplate & { signees: TemplateSignee[] }> => {
  const [template] = await db
    .insert(schema.documentTemplates)
    .values({
      organizationId: args.organizationId,
      organizationUnitId: args.organizationUnitId ?? null,
      reimbursementTypeId: args.reimbursementTypeId,
      kind: args.kind,
      body: args.body ?? EMPTY_BODY,
    })
    .returning();
  if (!template) {
    throw new Error('Failed to create document template');
  }

  const signees = await db
    .insert(schema.templateSignees)
    .values(
      args.signees.map((signee) => ({
        documentTemplateId: template.id,
        order: signee.order,
        signeeType: signee.signeeType,
        requiredPermissionId: signee.requiredPermissionId ?? null,
      })),
    )
    .returning();

  return { ...template, signees };
};

/** A volunteer-then-permission-holder template, matching the real signing chain. */
export const createTwoStepTemplate = async (
  db: Database,
  args: {
    organizationId: string;
    reimbursementTypeId: string;
    kind: DocumentKind;
    requiredPermissionId: string;
    signeeTypes: [SigneeType, SigneeType];
    body?: DocumentTemplateBody;
  },
) =>
  createDocumentTemplate(db, {
    organizationId: args.organizationId,
    reimbursementTypeId: args.reimbursementTypeId,
    kind: args.kind,
    body: args.body,
    signees: [
      { order: 0, signeeType: args.signeeTypes[0] },
      {
        order: 1,
        signeeType: args.signeeTypes[1],
        requiredPermissionId: args.requiredPermissionId,
      },
    ],
  });

/** Creates a throwaway shift + instance so a completed time entry can attach to it. */
export const createCompletedTimeEntry = async (
  db: Database,
  args: {
    organizationUnitId: string;
    volunteerId: string;
    reimbursementTypeId: string;
    startedAt: Date;
    endedAt: Date;
  },
): Promise<TimeEntry> => {
  const shift = await createShift(db, {
    organizationUnitId: args.organizationUnitId,
    createdById: args.volunteerId,
    startsAt: args.startedAt,
    endsAt: args.endedAt,
  });
  const instance = await createShiftInstance(db, shift.id, {
    actualStartsAt: args.startedAt,
    actualEndsAt: args.endedAt,
  });

  const [entry] = await db
    .insert(schema.timeEntries)
    .values({
      shiftInstanceId: instance.id,
      organizationUnitId: args.organizationUnitId,
      volunteerId: args.volunteerId,
      reimbursementTypeId: args.reimbursementTypeId,
      startedAt: args.startedAt,
      endedAt: args.endedAt,
    })
    .returning();
  if (!entry) {
    throw new Error('Failed to create time entry');
  }
  return entry;
};
