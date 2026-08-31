import { describe, expect, it } from 'bun:test';
import {
  ContractStatus,
  DocumentKind,
  DocumentStatusChange,
  InvoiceStatus,
  ReimbursementTypeKey,
  SigneeType,
} from '@repo/data';
import {
  contractToVolunteerDocument,
  documentLines,
  documentState,
  periodLabel,
} from './volunteer-documents.utils';

const formatMonth = (date: Date) =>
  new Intl.DateTimeFormat('de-DE', {
    month: 'long',
    year: 'numeric',
  }).format(date);

function signature(overrides: Record<string, unknown> = {}) {
  return {
    id: 's-1',
    order: 0,
    signeeType: SigneeType.Volunteer,
    signedAt: null,
    signedByUser: null,
    requiredPermission: null,
    ...overrides,
  };
}

function statusChange(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c-1',
    type: DocumentStatusChange.Created,
    occurredAt: '2026-07-13T09:00:00.000Z',
    actorUser: { id: 'u-admin', name: 'Admin V.' },
    ...overrides,
  };
}

describe('documentState', () => {
  it('maps awaiting-volunteer to awaiting-signature', () => {
    expect(documentState(ContractStatus.AwaitingVolunteerSignature)).toBe(
      'awaiting-signature',
    );
    expect(documentState(InvoiceStatus.AwaitingVolunteerSignature)).toBe(
      'awaiting-signature',
    );
  });

  it('maps waiting-on-org states to awaiting-countersignature', () => {
    expect(documentState(ContractStatus.AwaitingNgoSignature)).toBe(
      'awaiting-countersignature',
    );
    expect(documentState(InvoiceStatus.AwaitingSupervisorSignature)).toBe(
      'awaiting-countersignature',
    );
  });

  it('maps fully signed states to signed', () => {
    expect(documentState(ContractStatus.Active)).toBe('signed');
    expect(documentState(InvoiceStatus.Ready)).toBe('signed');
  });

  it('maps declined to declined', () => {
    expect(documentState(ContractStatus.Declined)).toBe('declined');
    expect(documentState(InvoiceStatus.Declined)).toBe('declined');
  });
});

describe('periodLabel', () => {
  it('renders the year for a contract', () => {
    expect(
      periodLabel('contract', '2026-01-01T00:00:00.000Z', formatMonth),
    ).toBe('2026');
  });

  it('renders month + year for an invoice', () => {
    expect(
      periodLabel('invoice', '2026-07-01T00:00:00.000Z', formatMonth),
    ).toBe('Juli 2026');
  });
});

describe('documentLines', () => {
  it('shows the generation line when nobody has signed', () => {
    const lines = documentLines({
      signatures: [signature()],
      statusChanges: [statusChange()],
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.kind).toBe('generated');
    expect(lines[0]?.actorName).toBe('Admin V.');
    expect(lines[0]?.occurredAt).toEqual(new Date('2026-07-13T09:00:00.000Z'));
  });

  it('shows the volunteer signature line once signed', () => {
    const lines = documentLines({
      signatures: [
        signature({
          signedAt: '2026-07-14T10:00:00.000Z',
          signedByUser: { id: 'u-vol', name: 'Alexandra Bauer' },
        }),
      ],
      statusChanges: [statusChange()],
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.kind).toBe('signed-by-me');
  });

  it('shows both signature lines on a fully signed agreement', () => {
    const lines = documentLines({
      signatures: [
        signature({
          order: 0,
          signedAt: '2026-07-14T10:00:00.000Z',
          signedByUser: { id: 'u-vol', name: 'Alexandra Bauer' },
        }),
        signature({
          id: 's-2',
          order: 1,
          signeeType: SigneeType.PermissionHolder,
          signedAt: '2026-07-15T11:00:00.000Z',
          signedByUser: { id: 'u-admin', name: 'Admin V.' },
        }),
      ],
      statusChanges: [statusChange()],
    });
    expect(lines.map((l) => l.kind)).toEqual([
      'signed-by-me',
      'countersigned-by',
    ]);
    expect(lines[1]?.actorName).toBe('Admin V.');
  });

  it('shows the decline line when declined', () => {
    const lines = documentLines({
      signatures: [signature({ signedAt: '2026-07-14T10:00:00.000Z' })],
      statusChanges: [statusChange()],
      declinedByUserName: 'Admin V.',
      declinedAt: new Date('2026-07-16T09:00:00.000Z'),
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.kind).toBe('declined-by');
    expect(lines[0]?.actorName).toBe('Admin V.');
  });
});

describe('contractToVolunteerDocument', () => {
  it('derives the card model from a contract summary', () => {
    const doc = contractToVolunteerDocument(
      {
        id: 'contract-1',
        contractStatus: ContractStatus.AwaitingVolunteerSignature,
        periodStart: '2026-01-01T00:00:00.000Z',
        periodEnd: '2027-01-01T00:00:00.000Z',
        isNonCompliant: false,
        declineReason: null,
        declinedAt: null,
        declinedAtSigneeType: null,
        declinedByUser: null,
        renewDate: null,
        downloadUrl: null,
        missingProfileFields: [],
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: null,
        volunteer: { id: 'v-1', name: 'Alexandra Bauer', image: null },
        reimbursementType: { id: 'rt-1', key: ReimbursementTypeKey.Ehrenamt },
        documentTemplate: { id: 'dt-1', kind: DocumentKind.Contract },
        signatures: [],
        statusChanges: [statusChange()],
      },
      formatMonth,
    );
    expect(doc.kind).toBe('contract');
    expect(doc.nameKey).toBe('agreement');
    expect(doc.periodLabel).toBe('2026');
    expect(doc.state).toBe('awaiting-signature');
    expect(doc.figures).toBeUndefined();
    expect(doc.lines[0]?.kind).toBe('generated');
  });
});
