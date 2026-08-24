import type {
  ContractFilterInput,
  CreateContractInput,
  CreateInvoiceInput,
  GetContractQuery,
  GetContractsQuery,
  GetEffectiveRatesQuery,
  GetEligibleTimeEntriesForInvoiceQuery,
  GetInvoiceQuery,
  GetInvoicesQuery,
  GetPendingContractSigneeQuery,
  GetReimbursementTypesQuery,
  GetRosterYearlyUsageQuery,
  GetYearlyUsageQuery,
  InvoiceFilterInput,
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
  const status = 'contractStatus' in doc ? doc.contractStatus : doc.invoiceStatus;

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
