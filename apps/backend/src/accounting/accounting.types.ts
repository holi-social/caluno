import { InferResultType } from '../database/typeutil';
import { ContractStatus, InvoiceStatus, SigneeType } from './enums';
import type { ReimbursementTypeEntity } from './schemas/reimbursement-type.schema';

export type ContractFilter = {
  volunteerId?: string;
  reimbursementTypeId?: string;
  status?: ContractStatus;
  periodStart?: Date;
  periodEnd?: Date;
};

export type InvoiceFilter = {
  volunteerId?: string;
  reimbursementTypeId?: string;
  status?: InvoiceStatus;
  periodStart?: Date;
  periodEnd?: Date;
};

export type EffectiveRate = {
  reimbursementType: ReimbursementTypeEntity;
  hourlyRateCents: number;
  isOverride: boolean;
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
  }
>;
