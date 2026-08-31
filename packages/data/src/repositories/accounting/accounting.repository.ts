import type {
  ContractFilterInput,
  CreateContractInput,
  CreateDocumentTemplateInput,
  CreateInvoiceInput,
  DocumentKind,
  GetBundleDownloadStatusQuery,
  GetContractQuery,
  GetContractsQuery,
  GetDocumentTemplateQuery,
  GetDocumentTemplatesQuery,
  GetEffectiveRatesQuery,
  GetEligibleTimeEntriesForInvoiceQuery,
  GetInvoiceQuery,
  GetInvoicesQuery,
  GetManualBaselineQuery,
  GetPendingContractSigneeQuery,
  GetReimbursementTypesQuery,
  GetRosterYearlyUsageQuery,
  GetYearlyUsageQuery,
  InvoiceFilterInput,
  MyDocumentSummaryQuery,
  MyDocumentsQuery,
  RecordBundleDownloadMutation,
  SetManualBaselineMutation,
  UpdateDocumentTemplateInput,
} from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

// Prefixed with `Raw` to avoid colliding with the same-named entity types
// exported from `generated/graphql.ts` (see `RawShift` in shift.repository.ts
// for the established convention).
export type RawReimbursementType =
  GetReimbursementTypesQuery['reimbursementTypes'][number];
export type RawEffectiveRate = GetEffectiveRatesQuery['effectiveRates'][number];
export type RawYearlyUsage = GetYearlyUsageQuery['yearlyUsage'];
export type RawVolunteerYearlyUsage =
  GetRosterYearlyUsageQuery['rosterYearlyUsage'][number];

export type ContractSummary = GetContractsQuery['contracts'][number];
export type ContractDetail = GetContractQuery['contract'];
// Prefixed with `Raw` because `PendingSignee` collides with the same-named
// entity type exported from `generated/graphql.ts`.
export type RawPendingSignee =
  GetPendingContractSigneeQuery['pendingContractSignee'];

export type InvoiceSummary = GetInvoicesQuery['invoices'][number];
export type InvoiceDetail = GetInvoiceQuery['invoice'];
export type EligibleTimeEntry =
  GetEligibleTimeEntriesForInvoiceQuery['eligibleTimeEntriesForInvoice'][number];

export type DocumentTemplateSummary =
  GetDocumentTemplatesQuery['documentTemplates'][number];

/** Cross-org "My documents" — one group per organization. */
export type MyDocumentsGroupData = MyDocumentsQuery['myDocuments'][number];

/** Dropdown summary — total documents and how many need the signature. */
export type MyDocumentSummaryData = MyDocumentSummaryQuery['myDocumentSummary'];
export type DocumentTemplateDetail =
  GetDocumentTemplateQuery['documentTemplate'];

// Prefixed with `Raw` because `BundleDownloadStatus` collides with the
// same-named entity type exported from `generated/graphql.ts`.
export type RawBundleDownloadStatus =
  GetBundleDownloadStatusQuery['bundleDownloadStatus'];
export type RecordedBundleDownload =
  RecordBundleDownloadMutation['recordBundleDownload'];

// Prefixed with `Raw` because `ManualBaseline` collides with the same-named
// entity type exported from `generated/graphql.ts`.
export type RawManualBaseline = GetManualBaselineQuery['manualBaseline'];
export type SetManualBaselineResult =
  SetManualBaselineMutation['setManualBaseline'];

export class AccountingRepository extends BaseRepository {
  async findReimbursementTypes(): Promise<RawReimbursementType[]> {
    const data = await this.sdk.GetReimbursementTypes();
    return data.reimbursementTypes;
  }

  async findEffectiveRates(
    organizationUnitId?: string,
  ): Promise<RawEffectiveRate[]> {
    const data = await this.sdk.GetEffectiveRates({ organizationUnitId });
    return data.effectiveRates;
  }

  async setReimbursementRate(input: {
    reimbursementTypeId: string;
    hourlyRateCents: number;
    organizationUnitId?: string;
  }) {
    const data = await this.sdk.SetReimbursementRate(input);
    return data.setReimbursementRate;
  }

  async findYearlyUsage(
    reimbursementTypeId: string,
    year: number,
  ): Promise<RawYearlyUsage> {
    const data = await this.sdk.GetYearlyUsage({ reimbursementTypeId, year });
    return data.yearlyUsage;
  }

  async findRosterYearlyUsage(
    organizationUnitId: string,
    year: number,
  ): Promise<RawVolunteerYearlyUsage[]> {
    const data = await this.sdk.GetRosterYearlyUsage({
      organizationUnitId,
      year,
    });
    return data.rosterYearlyUsage;
  }

  async findContracts(
    filter?: ContractFilterInput,
  ): Promise<ContractSummary[]> {
    const data = await this.sdk.GetContracts({ filter });
    return data.contracts;
  }

  async findMyContracts(
    filter?: ContractFilterInput,
  ): Promise<ContractSummary[]> {
    const data = await this.sdk.GetMyContracts({ filter });
    return data.myContracts;
  }

  async findContractById(id: string): Promise<ContractDetail> {
    const data = await this.sdk.GetContract({ id });
    return data.contract;
  }

  async findPendingContractSignee(
    contractId: string,
  ): Promise<RawPendingSignee> {
    const data = await this.sdk.GetPendingContractSignee({ contractId });
    return data.pendingContractSignee;
  }

  async createContract(input: CreateContractInput): Promise<ContractSummary> {
    const data = await this.sdk.CreateContract({ input });
    return data.createContract;
  }

  async signContract(contractId: string): Promise<ContractSummary> {
    const data = await this.sdk.SignContract({ contractId });
    return data.signContract;
  }

  async declineContract(
    contractId: string,
    reason: string,
  ): Promise<ContractSummary> {
    const data = await this.sdk.DeclineContract({ contractId, reason });
    return data.declineContract;
  }

  async findInvoices(filter?: InvoiceFilterInput): Promise<InvoiceSummary[]> {
    const data = await this.sdk.GetInvoices({ filter });
    return data.invoices;
  }

  async findMyInvoices(filter?: InvoiceFilterInput): Promise<InvoiceSummary[]> {
    const data = await this.sdk.GetMyInvoices({ filter });
    return data.myInvoices;
  }

  async findMyDocuments(): Promise<MyDocumentsGroupData[]> {
    const data = await this.sdk.MyDocuments();
    return data.myDocuments;
  }

  async findMyDocumentSummary(): Promise<MyDocumentSummaryData> {
    const data = await this.sdk.MyDocumentSummary();
    return data.myDocumentSummary;
  }

  async findInvoiceById(id: string): Promise<InvoiceDetail> {
    const data = await this.sdk.GetInvoice({ id });
    return data.invoice;
  }

  async findPendingInvoiceSignee(invoiceId: string): Promise<RawPendingSignee> {
    const data = await this.sdk.GetPendingInvoiceSignee({ invoiceId });
    return data.pendingInvoiceSignee;
  }

  async findEligibleTimeEntriesForInvoice(input: {
    volunteerId: string;
    reimbursementTypeId: string;
    periodStart?: string;
    periodEnd?: string;
  }): Promise<EligibleTimeEntry[]> {
    const data = await this.sdk.GetEligibleTimeEntriesForInvoice(input);
    return data.eligibleTimeEntriesForInvoice;
  }

  async createInvoice(input: CreateInvoiceInput): Promise<InvoiceSummary> {
    const data = await this.sdk.CreateInvoice({ input });
    return data.createInvoice;
  }

  async signInvoice(invoiceId: string): Promise<InvoiceSummary> {
    const data = await this.sdk.SignInvoice({ invoiceId });
    return data.signInvoice;
  }

  async declineInvoice(
    invoiceId: string,
    reason: string,
  ): Promise<InvoiceSummary> {
    const data = await this.sdk.DeclineInvoice({ invoiceId, reason });
    return data.declineInvoice;
  }

  async findDocumentTemplates(): Promise<DocumentTemplateSummary[]> {
    const data = await this.sdk.GetDocumentTemplates();
    return data.documentTemplates;
  }

  async findDocumentTemplateById(id: string): Promise<DocumentTemplateDetail> {
    const data = await this.sdk.GetDocumentTemplate({ id });
    return data.documentTemplate;
  }

  async findActiveDocumentTemplate(input: {
    kind: DocumentKind;
    reimbursementTypeId: string;
    organizationUnitId?: string;
  }): Promise<DocumentTemplateDetail> {
    const data = await this.sdk.GetActiveDocumentTemplate(input);
    return data.activeDocumentTemplate;
  }

  async createDocumentTemplate(
    input: CreateDocumentTemplateInput,
  ): Promise<DocumentTemplateSummary> {
    const data = await this.sdk.CreateDocumentTemplate({ input });
    return data.createDocumentTemplate;
  }

  async updateDocumentTemplate(
    id: string,
    input: UpdateDocumentTemplateInput,
  ): Promise<DocumentTemplateSummary> {
    const data = await this.sdk.UpdateDocumentTemplate({ id, input });
    return data.updateDocumentTemplate;
  }

  async deleteDocumentTemplate(id: string): Promise<boolean> {
    const data = await this.sdk.DeleteDocumentTemplate({ id });
    return data.deleteDocumentTemplate;
  }

  async findBundleDownloadStatus(
    volunteerId: string,
    reimbursementTypeId: string,
  ): Promise<RawBundleDownloadStatus> {
    const data = await this.sdk.GetBundleDownloadStatus({
      volunteerId,
      reimbursementTypeId,
    });
    return data.bundleDownloadStatus;
  }

  async recordBundleDownload(
    volunteerId: string,
    reimbursementTypeId: string,
    invoiceIds?: string[],
  ): Promise<RecordedBundleDownload> {
    const data = await this.sdk.RecordBundleDownload({
      volunteerId,
      reimbursementTypeId,
      invoiceIds,
    });
    return data.recordBundleDownload;
  }

  async findManualBaseline(
    volunteerId: string,
    reimbursementTypeId: string,
    year: number,
  ): Promise<RawManualBaseline> {
    const data = await this.sdk.GetManualBaseline({
      volunteerId,
      reimbursementTypeId,
      year,
    });
    return data.manualBaseline;
  }

  async setManualBaseline(input: {
    volunteerId: string;
    reimbursementTypeId: string;
    year: number;
    amountCents: number;
  }): Promise<SetManualBaselineResult> {
    const data = await this.sdk.SetManualBaseline(input);
    return data.setManualBaseline;
  }
}

export type DocumentDisplayStatus =
  | 'awaiting-volunteer-signature'
  | 'awaiting-ngo-signature'
  | 'active'
  | 'ready' // invoice-only: READY means both signatures are present and it's payable
  | 'declined'
  | 'expired';

type SignatureLike = {
  order: number;
  signeeType: 'VOLUNTEER' | 'PERMISSION_HOLDER';
  signedAt?: string | null;
};

type DocumentLike =
  | { contractStatus: string; signatures: SignatureLike[] }
  | { invoiceStatus: string; signatures: SignatureLike[] };

export function deriveDocumentStatus(doc: DocumentLike): DocumentDisplayStatus {
  const status =
    'contractStatus' in doc ? doc.contractStatus : doc.invoiceStatus;

  if (status === 'DECLINED') return 'declined';
  if (status === 'EXPIRED') return 'expired';
  if (status === 'READY') return 'ready';
  if (status === 'ACTIVE') return 'active';

  const nextSigner = [...doc.signatures]
    .sort((a, b) => a.order - b.order)
    .find((signature) => !signature.signedAt);

  if (!nextSigner) return 'active';
  return nextSigner.signeeType === 'VOLUNTEER'
    ? 'awaiting-volunteer-signature'
    : 'awaiting-ngo-signature';
}
