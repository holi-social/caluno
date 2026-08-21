import { InferResultType } from '../database/typeutil';
import {
  ContractStatus,
  DocumentKind,
  InvoiceStatus,
  RenewalCadence,
  SigneeType,
} from './enums';
import type { DocumentTemplateBody } from './schemas/document-template.schema';
import type { ReimbursementTypeEntity } from './schemas/reimbursement-type.schema';

export type CreateTemplateSigneeInput = {
  order: number;
  signeeType: SigneeType;
  requiredPermissionId?: string | null;
};

export type CreateDocumentTemplateInput = {
  // Omit for the organization-wide default template; set to an organization
  // unit ID to create an override for that unit only.
  organizationUnitId?: string | null;
  reimbursementTypeId: string;
  kind: DocumentKind;
  renewalCadence?: RenewalCadence | null;
  invoiceNumberFormat?: string | null;
  body: DocumentTemplateBody;
  signees: CreateTemplateSigneeInput[];
};

export type UpdateDocumentTemplateInput = Partial<
  Pick<
    CreateDocumentTemplateInput,
    'renewalCadence' | 'invoiceNumberFormat' | 'body' | 'signees'
  >
>;

export type ContractFilter = {
  volunteerId?: string;
  reimbursementTypeId?: string;
  status?: ContractStatus;
};

export type InvoiceFilter = {
  volunteerId?: string;
  reimbursementTypeId?: string;
  status?: InvoiceStatus;
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
