import {
  ContractStatus,
  type ContractSummary,
  DocumentStatusChange,
  InvoiceStatus,
  type InvoiceSummary,
  SigneeType,
} from '@repo/data';

// ─── Model ───────────────────────────────────────────────────────────────────

export type VolunteerDocumentKind = 'contract' | 'invoice';

/**
 * Structural subset of both contract and invoice signatures/status changes
 * (they only differ in __typename).
 */
interface SignatureEntry {
  signeeType: SigneeType;
  signedAt?: string | null;
  signedByUser?: { name?: string } | null;
}

interface StatusChangeEntry {
  type: DocumentStatusChange;
  occurredAt: string;
  actorUser?: { name?: string } | null;
}

export type VolunteerDocumentState =
  | 'awaiting-signature'
  | 'awaiting-countersignature'
  | 'signed'
  | 'declined';

/**
 * One document on the volunteer's "Your documents" list. Everything the card
 * renders is derived here from the summary fragment so the component layer
 * stays presentation-only.
 */
export interface VolunteerDocument {
  id: string;
  kind: VolunteerDocumentKind;
  /** "Juli 2026" for a monthly timesheet, "2026" for a year-long agreement. */
  periodLabel: string;
  /** i18n key suffix for the document name ("Stundennachweis" / "Zusatzvereinbarung"). */
  nameKey: 'timesheet' | 'agreement';
  state: VolunteerDocumentState;
  /** Invoice-only: "3 Shifts · 10 hours · 234 €". */
  figures?: {
    shiftCount: number;
    totalHours: number;
    totalAmountCents: number;
  };
  /**
   * Provenance lines, most relevant first: the generation line when nobody
   * has signed, the volunteer's signature line once signed, and the org's
   * countersignature line once fully signed.
   */
  lines: VolunteerDocumentLine[];
  declineReason?: string | null;
  downloadUrl?: string | null;
  createdAt: Date;
}

/** A single "who did what, when" line on a card. */
export interface VolunteerDocumentLine {
  kind: 'generated' | 'signed-by-me' | 'countersigned-by' | 'declined-by';
  /** The actor's display name ("Admin V.") — generated/countersigned-by/declined-by. */
  actorName?: string;
  occurredAt: Date;
}

const signatureDate = (value: string | null | undefined): Date | undefined =>
  value ? new Date(value) : undefined;

function volunteerSignedAt(signatures: SignatureEntry[]): Date | undefined {
  const mine = signatures.find((s) => s.signeeType === SigneeType.Volunteer);
  return signatureDate(mine?.signedAt);
}

function orgSignature(signatures: SignatureEntry[]) {
  return signatures.find((s) => s.signeeType === SigneeType.PermissionHolder);
}

function generatedAt(
  statusChanges: StatusChangeEntry[],
): { occurredAt: Date; actorName?: string } | undefined {
  const created = statusChanges.find(
    (c) => c.type === DocumentStatusChange.Created,
  );
  return created
    ? {
        occurredAt: new Date(created.occurredAt),
        actorName: created.actorUser?.name,
      }
    : undefined;
}

/**
 * Builds the provenance lines for a document. Contracts (agreements) show
 * both sides of the paper trail once fully signed; invoices show the single
 * most recent action, matching the design's card variants.
 */
export function documentLines(args: {
  signatures: SignatureEntry[];
  statusChanges: StatusChangeEntry[];
  declinedByUserName?: string | null;
  declinedAt?: Date | null;
}): VolunteerDocumentLine[] {
  const { signatures, statusChanges } = args;
  const mine = volunteerSignedAt(signatures);
  const org = orgSignature(signatures);
  const orgDate = signatureDate(org?.signedAt);

  if (args.declinedAt) {
    return [
      {
        kind: 'declined-by',
        actorName: args.declinedByUserName ?? undefined,
        occurredAt: args.declinedAt,
      },
    ];
  }

  if (mine && orgDate) {
    // Fully signed — the agreement card shows both signatures.
    return [
      { kind: 'signed-by-me', occurredAt: mine },
      {
        kind: 'countersigned-by',
        actorName: org?.signedByUser?.name,
        occurredAt: orgDate,
      },
    ];
  }

  if (mine) {
    return [{ kind: 'signed-by-me', occurredAt: mine }];
  }

  const created = generatedAt(statusChanges);
  if (created) {
    return [
      {
        kind: 'generated',
        actorName: created.actorName,
        occurredAt: created.occurredAt,
      },
    ];
  }

  // No status change recorded yet (shouldn't happen) — fall back to nothing.
  return [];
}

// ─── Period labels ────────────────────────────────────────────────────────────

/**
 * "2026" for a year-long agreement; "Juli 2026" for a monthly timesheet.
 * Accepts an injected formatter so callers control the locale.
 */
export function periodLabel(
  kind: VolunteerDocumentKind,
  periodStart: string,
  formatMonth: (date: Date) => string,
): string {
  const start = new Date(periodStart);
  return kind === 'contract' ? String(start.getFullYear()) : formatMonth(start);
}

// ─── State ────────────────────────────────────────────────────────────────────

/**
 * Maps a backend document status to the volunteer's five display states.
 * Everything a card renders hangs off this: the pill, the actions offered,
 * and (with `documentLines`) the provenance lines.
 */
export function documentState(
  status: ContractStatus | InvoiceStatus,
): VolunteerDocumentState {
  if (status === ContractStatus.Declined || status === InvoiceStatus.Declined) {
    return 'declined';
  }
  if (
    status === ContractStatus.AwaitingVolunteerSignature ||
    status === InvoiceStatus.AwaitingVolunteerSignature
  ) {
    return 'awaiting-signature';
  }
  if (
    status === ContractStatus.AwaitingNgoSignature ||
    status === InvoiceStatus.AwaitingSupervisorSignature
  ) {
    return 'awaiting-countersignature';
  }
  // ACTIVE / READY / EXPIRED — fully signed; download-only.
  return 'signed';
}

// ─── Full mapping ─────────────────────────────────────────────────────────────

export function contractToVolunteerDocument(
  contract: ContractSummary,
  formatMonth: (date: Date) => string,
): VolunteerDocument {
  const declinedAt = contract.declinedAt
    ? new Date(contract.declinedAt)
    : undefined;
  return {
    id: contract.id,
    kind: 'contract',
    periodLabel: periodLabel('contract', contract.periodStart, formatMonth),
    nameKey: 'agreement',
    state: documentState(contract.contractStatus),
    lines: documentLines({
      signatures: contract.signatures,
      statusChanges: contract.statusChanges,
      declinedByUserName: contract.declinedByUser?.name,
      declinedAt,
    }),
    declineReason: contract.declineReason,
    downloadUrl: contract.downloadUrl,
    createdAt: new Date(contract.createdAt),
  };
}

export function invoiceToVolunteerDocument(
  invoice: InvoiceSummary,
  formatMonth: (date: Date) => string,
): VolunteerDocument {
  const declinedAt = invoice.declinedAt
    ? new Date(invoice.declinedAt)
    : undefined;
  return {
    id: invoice.id,
    kind: 'invoice',
    periodLabel: periodLabel('invoice', invoice.periodStart, formatMonth),
    nameKey: 'timesheet',
    state: documentState(invoice.invoiceStatus),
    figures: {
      shiftCount: invoice.invoiceTimeEntries.length,
      totalHours: invoice.totalHours,
      totalAmountCents: invoice.totalAmountCents,
    },
    lines: documentLines({
      signatures: invoice.signatures,
      statusChanges: invoice.statusChanges,
      declinedByUserName: invoice.declinedByUser?.name,
      declinedAt,
    }),
    declineReason: invoice.declineReason,
    downloadUrl: invoice.downloadUrl,
    createdAt: new Date(invoice.createdAt),
  };
}
