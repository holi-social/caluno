import {
  ContractStatus,
  type ContractSummary,
  InvoiceStatus,
  type InvoiceSummary,
  PermissionKey,
  type RawVolunteerYearlyUsage,
  SigneeType,
} from '@repo/data';
import type { PauschalenType } from '../components/doc-type-header';
import type {
  BoardDocument,
  BoardVolunteer,
  DocStatus,
} from '../components/reimbursements-board';
import type { Signee, SigneeRole } from '../components/template/types';
import { centsToEuros } from './money';
import { pauschaleForReimbursementTypeKey } from './reimbursement-type-mapping';

export type RawContract = ContractSummary;
export type RawInvoice = InvoiceSummary;
export type RawVolunteerUsage = RawVolunteerYearlyUsage;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return `${first}${last ?? ''}`.toUpperCase();
}

export function contractStatusToDocStatus(status: ContractStatus): DocStatus {
  switch (status) {
    case ContractStatus.AwaitingVolunteerSignature:
      return 'contract-signing-vol';
    case ContractStatus.AwaitingNgoSignature:
      return 'contract-signing-coord';
    case ContractStatus.Active:
    case ContractStatus.Expired:
      return 'contract-active';
    case ContractStatus.Declined:
      return 'contract-declined';
    default:
      return 'contract-generate';
  }
}

export function invoiceStatusToDocStatus(status: InvoiceStatus): DocStatus {
  switch (status) {
    case InvoiceStatus.AwaitingVolunteerSignature:
      return 'timesheet-signing-vol';
    case InvoiceStatus.AwaitingSupervisorSignature:
      return 'timesheet-signing-super';
    case InvoiceStatus.Ready:
      return 'timesheet-ready';
    case InvoiceStatus.Declined:
      return 'timesheet-declined';
    default:
      return 'timesheet-generate';
  }
}

function signeeTypeToRole(
  signeeType: SigneeType,
  kind: 'contract' | 'invoice',
): SigneeRole {
  if (signeeType === SigneeType.Volunteer) return 'volunteer';
  return kind === 'contract' ? 'coordinator' : 'supervisor';
}

export function mapDeclinedAtRole(
  signeeType: SigneeType | null | undefined,
  kind: 'contract' | 'invoice',
): SigneeRole | undefined {
  if (!signeeType) return undefined;
  return signeeTypeToRole(signeeType, kind);
}

export function mapSignatureToSignee(
  signature:
    | RawContract['signatures'][number]
    | RawInvoice['signatures'][number],
  kind: 'contract' | 'invoice',
): Signee {
  const role = signeeTypeToRole(signature.signeeType, kind);
  return {
    id: signature.id,
    role,
    orgRole: {
      id: signature.requiredPermission?.id ?? `role-${role}`,
      name: signature.requiredPermission?.key ?? PermissionKey.AccountingManage,
    },
  };
}

export function mapContractToBoardDoc(
  contract: RawContract,
  type: PauschalenType,
): BoardDocument {
  return {
    id: contract.id,
    status: contractStatusToDocStatus(contract.contractStatus),
    lastActionDate: new Date(contract.updatedAt ?? contract.createdAt),
    periodLabel: String(new Date(contract.periodStart).getFullYear()),
    pauschale: type,
    declineReason: contract.declineReason ?? undefined,
    declinedAt: contract.declinedAt ? new Date(contract.declinedAt) : undefined,
    declinedAtRole: mapDeclinedAtRole(
      contract.declinedAtSigneeType,
      'contract',
    ),
  };
}

export function mapInvoiceToBoardDoc(
  invoice: RawInvoice,
  type: PauschalenType,
  locale: string,
): BoardDocument {
  return {
    id: invoice.id,
    status: invoiceStatusToDocStatus(invoice.invoiceStatus),
    amount: centsToEuros(invoice.totalAmountCents),
    hours: invoice.totalHours,
    lastActionDate: new Date(invoice.updatedAt ?? invoice.createdAt),
    periodLabel: formatMonthYear(new Date(invoice.periodStart), locale),
    pauschale: type,
    declineReason: invoice.declineReason ?? undefined,
    declinedAt: invoice.declinedAt ? new Date(invoice.declinedAt) : undefined,
    declinedAtRole: mapDeclinedAtRole(invoice.declinedAtSigneeType, 'invoice'),
  };
}

export function contractPeriodOverlapsYear(
  contract: RawContract,
  year: number,
): boolean {
  const start = new Date(contract.periodStart).getFullYear();
  const end = new Date(contract.periodEnd).getFullYear();
  return start <= year && end >= year;
}

export function invoiceInMonth(
  invoice: RawInvoice,
  year: number,
  month: number,
): boolean {
  const start = new Date(invoice.periodStart);
  return start.getFullYear() === year && start.getMonth() === month;
}

export function formatMonthYear(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function monthsInRange(
  _year: number,
  range?: { from?: Date; to?: Date },
): Array<{ year: number; month: number }> {
  const now = new Date();
  if (!range?.from) {
    return [{ year: now.getFullYear(), month: now.getMonth() }];
  }
  const result: Array<{ year: number; month: number }> = [];
  const from = range.from;
  const to = range.to ?? from;
  let current = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (current <= end) {
    result.push({ year: current.getFullYear(), month: current.getMonth() });
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }
  return result;
}

export interface BuildBoardVolunteersInput {
  rosterUsage: RawVolunteerUsage[];
  contracts: RawContract[];
  invoices: RawInvoice[];
  year: number;
  locale: string;
  dateRange?: { from?: Date; to?: Date };
}

export function buildBoardVolunteers({
  rosterUsage,
  contracts,
  invoices,
  year,
  locale,
  dateRange,
}: BuildBoardVolunteersInput): BoardVolunteer[] {
  return rosterUsage.map((entry) => {
    const documents: BoardDocument[] = [];
    const limits: Partial<
      Record<PauschalenType, { used: number; total: number }>
    > = {};
    const reimbursementTypeIds: Partial<Record<PauschalenType, string>> = {};

    for (const usage of entry.usageByType) {
      const type = pauschaleForReimbursementTypeKey(
        usage.reimbursementType.key,
      );
      limits[type] = {
        used: centsToEuros(usage.usedCents),
        total: centsToEuros(usage.limitCents),
      };
      reimbursementTypeIds[type] = usage.reimbursementType.id;

      const contractsForType = contracts.filter(
        (c) =>
          c.volunteer.id === entry.volunteer.id &&
          c.reimbursementType.id === usage.reimbursementType.id &&
          contractPeriodOverlapsYear(c, year),
      );

      for (const contract of contractsForType) {
        documents.push(mapContractToBoardDoc(contract, type));
      }

      const activeContract = contractsForType.find(
        (c) => c.contractStatus === ContractStatus.Active,
      );

      if (activeContract) {
        const months = monthsInRange(year, dateRange);
        for (const { year: y, month } of months) {
          const invoicesForMonth = invoices.filter(
            (i) =>
              i.volunteer.id === entry.volunteer.id &&
              i.reimbursementType.id === usage.reimbursementType.id &&
              invoiceInMonth(i, y, month),
          );
          for (const invoice of invoicesForMonth) {
            documents.push(mapInvoiceToBoardDoc(invoice, type, locale));
          }
        }
      }
    }

    const primaryType =
      (entry.usageByType[0]?.reimbursementType.key
        ? pauschaleForReimbursementTypeKey(
            entry.usageByType[0].reimbursementType.key,
          )
        : undefined) ?? 'ehrenamt';

    return {
      id: entry.volunteer.id,
      name: entry.volunteer.name,
      initials: getInitials(entry.volunteer.name),
      pauschale: primaryType,
      usedAmount: centsToEuros(
        entry.usageByType.reduce((sum, u) => sum + u.usedCents, 0),
      ),
      totalCap: centsToEuros(
        entry.usageByType.reduce((sum, u) => sum + u.limitCents, 0),
      ),
      limits,
      reimbursementTypeIds,
      documents,
    };
  });
}

export function boardYear(dateRange?: { from?: Date; to?: Date }): number {
  const now = new Date();
  return (
    dateRange?.from?.getFullYear() ??
    dateRange?.to?.getFullYear() ??
    now.getFullYear()
  );
}
