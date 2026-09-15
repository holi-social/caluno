import { InferResultType } from '../database/typeutil';
import type { RateProvenanceKind } from './enums';
import { ContractStatus, InvoiceStatus, SigneeType } from './enums';
import type { ReimbursementTypeEntity } from './schemas/reimbursement-type.schema';

export type ContractFilter = {
  volunteerId?: string;
  reimbursementTypeId?: string;
  status?: ContractStatus;
  periodStart?: Date;
  periodEnd?: Date;
  organizationUnitId?: string;
};

export type InvoiceFilter = {
  volunteerId?: string;
  reimbursementTypeId?: string;
  status?: InvoiceStatus;
  periodStart?: Date;
  periodEnd?: Date;
  organizationUnitId?: string;
};

export type RateProvenance = {
  kind: RateProvenanceKind;
  sourceName: string | null;
  replacesRateCents: number | null;
};

export type EffectiveRate = {
  reimbursementType: ReimbursementTypeEntity;
  hourlyRateCents: number;
  isOverride: boolean;
  /** The unit whose override won, null for the org-wide row or the default. */
  organizationUnitId: string | null;
  provenance: RateProvenance;
};

/**
 * A volunteer's eligible (unclaimed, completed) hours for one reimbursement
 * type in one Berlin calendar month: a timesheet still to be created.
 */
export type EligibleTimesheetVolunteer = {
  volunteerId: string;
  reimbursementTypeId: string;
  periodStart: Date;
  periodEnd: Date;
  eligibleHours: number;
};

export type YearlyUsage = {
  usedCents: number;
  limitCents: number;
  remainingCents: number;
};

export type PendingSignee =
  | { signeeType: SigneeType.VOLUNTEER; userId: string }
  | {
      signeeType: SigneeType.PERMISSION_HOLDER;
      permissionKey: string;
      eligibleUserIds: string[];
    };

export type ContractWithRelations = InferResultType<
  'contracts',
  {
    documentTemplate: true;
    reimbursementType: true;
    signatures: true;
    statusChanges: true;
    organizationUnit: true;
  }
>;

export type InvoiceWithRelations = InferResultType<
  'invoices',
  {
    documentTemplate: true;
    reimbursementType: true;
    signatures: true;
    statusChanges: true;
    invoiceTimeEntries: true;
    organizationUnit: true;
  }
>;
