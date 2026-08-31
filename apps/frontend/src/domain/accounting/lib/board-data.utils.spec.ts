import { describe, expect, it } from 'bun:test';
import {
  ContractStatus,
  DocumentKind,
  InvoiceStatus,
  PermissionKey,
  ReimbursementTypeKey,
  SigneeType,
} from '@repo/data';
import {
  boardYear,
  buildBoardVolunteers,
  contractPeriodOverlapsYear,
  contractStatusToDocStatus,
  formatMonthYear,
  getInitials,
  invoiceInMonth,
  invoiceStatusToDocStatus,
  mapContractToBoardDoc,
  mapDeclinedAtRole,
  mapInvoiceToBoardDoc,
  mapSignatureToSignee,
  monthsInRange,
} from './board-data.utils';

const ehrenamtType = {
  id: 'rt-ehrenamt',
  key: ReimbursementTypeKey.Ehrenamt,
  legalReference: '',
  yearlyLimitCents: 84_000,
  platformDefaultRateCents: 450,
};

const _uebungsleiterType = {
  id: 'rt-uebungsleiter',
  key: ReimbursementTypeKey.Uebungsleiter,
  legalReference: '',
  yearlyLimitCents: 300_000,
  platformDefaultRateCents: 1_200,
};

function makeContract(
  overrides: Partial<Parameters<typeof mapContractToBoardDoc>[0]> & {
    contractStatus?: ContractStatus;
  },
) {
  return {
    id: 'c-1',
    contractStatus: ContractStatus.AwaitingVolunteerSignature,
    periodStart: '2026-01-01T00:00:00.000Z',
    periodEnd: '2026-12-31T23:59:59.000Z',
    isNonCompliant: false,
    declineReason: null,
    declinedAt: null,
    declinedAtSigneeType: null,
    declinedByUser: null,
    renewDate: null,
    downloadUrl: null,
    missingProfileFields: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: null,
    volunteer: { id: 'v-1', name: 'Anna Müller', image: null },
    reimbursementType: ehrenamtType,
    documentTemplate: {
      id: 'dt-1',
      kind: DocumentKind.Contract,
      reimbursementType: ehrenamtType,
    },
    signatures: [],
    statusChanges: [],
    ...overrides,
  };
}

function makeInvoice(
  overrides: Partial<Parameters<typeof mapInvoiceToBoardDoc>[0]> & {
    invoiceStatus?: InvoiceStatus;
  },
) {
  return {
    id: 'i-1',
    invoiceStatus: InvoiceStatus.AwaitingVolunteerSignature,
    periodStart: '2026-07-01T00:00:00.000Z',
    periodEnd: '2026-07-31T23:59:59.000Z',
    totalAmountCents: 12_000,
    totalHours: 8,
    isNonCompliant: false,
    declineReason: null,
    declinedAt: null,
    declinedAtSigneeType: null,
    declinedByUser: null,
    downloadUrl: null,
    missingProfileFields: [],
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: null,
    volunteer: { id: 'v-1', name: 'Anna Müller', image: null },
    reimbursementType: ehrenamtType,
    documentTemplate: {
      id: 'dt-2',
      kind: DocumentKind.Invoice,
      reimbursementType: ehrenamtType,
    },
    invoiceTimeEntries: [],
    signatures: [],
    statusChanges: [],
    ...overrides,
  };
}

describe('getInitials', () => {
  it('returns first letters of first and last name', () => {
    expect(getInitials('Anna Müller')).toBe('AM');
    expect(getInitials('Ben Schmidt')).toBe('BS');
  });

  it('returns single initial for one name', () => {
    expect(getInitials('Madonna')).toBe('M');
  });
});

describe('contractStatusToDocStatus', () => {
  it('maps contract statuses to board statuses', () => {
    expect(
      contractStatusToDocStatus(ContractStatus.AwaitingVolunteerSignature),
    ).toBe('contract-signing-vol');
    expect(contractStatusToDocStatus(ContractStatus.AwaitingNgoSignature)).toBe(
      'contract-signing-coord',
    );
    expect(contractStatusToDocStatus(ContractStatus.Active)).toBe(
      'contract-active',
    );
    expect(contractStatusToDocStatus(ContractStatus.Expired)).toBe(
      'contract-active',
    );
    expect(contractStatusToDocStatus(ContractStatus.Declined)).toBe(
      'contract-declined',
    );
  });
});

describe('invoiceStatusToDocStatus', () => {
  it('maps invoice statuses to board statuses', () => {
    expect(
      invoiceStatusToDocStatus(InvoiceStatus.AwaitingVolunteerSignature),
    ).toBe('timesheet-signing-vol');
    expect(
      invoiceStatusToDocStatus(InvoiceStatus.AwaitingSupervisorSignature),
    ).toBe('timesheet-signing-super');
    expect(invoiceStatusToDocStatus(InvoiceStatus.Ready)).toBe(
      'timesheet-ready',
    );
    expect(invoiceStatusToDocStatus(InvoiceStatus.Declined)).toBe(
      'timesheet-declined',
    );
  });
});

describe('mapDeclinedAtRole', () => {
  it('maps volunteer signee type', () => {
    expect(mapDeclinedAtRole(SigneeType.Volunteer, 'contract')).toBe(
      'volunteer',
    );
  });

  it('maps permission holder to coordinator for contracts', () => {
    expect(mapDeclinedAtRole(SigneeType.PermissionHolder, 'contract')).toBe(
      'coordinator',
    );
  });

  it('maps permission holder to supervisor for invoices', () => {
    expect(mapDeclinedAtRole(SigneeType.PermissionHolder, 'invoice')).toBe(
      'supervisor',
    );
  });

  it('returns undefined for null/undefined', () => {
    expect(mapDeclinedAtRole(null, 'contract')).toBeUndefined();
    expect(mapDeclinedAtRole(undefined, 'invoice')).toBeUndefined();
  });
});

describe('mapSignatureToSignee', () => {
  it('maps volunteer signature', () => {
    const signee = mapSignatureToSignee(
      {
        id: 's-1',
        order: 0,
        signeeType: SigneeType.Volunteer,
        signedAt: null,
        signedByUser: null,
        requiredPermission: null,
      },
      'contract',
    );
    expect(signee.role).toBe('volunteer');
  });

  it('maps permission holder signature to coordinator for contracts', () => {
    const signee = mapSignatureToSignee(
      {
        id: 's-2',
        order: 1,
        signeeType: SigneeType.PermissionHolder,
        signedAt: null,
        signedByUser: null,
        requiredPermission: { id: 'p-1', key: PermissionKey.AccountingManage },
      },
      'contract',
    );
    expect(signee.role).toBe('coordinator');
  });
});

describe('mapContractToBoardDoc', () => {
  it('maps a contract to a board document', () => {
    const doc = mapContractToBoardDoc(makeContract({}), 'ehrenamt');
    expect(doc.status).toBe('contract-signing-vol');
    expect(doc.periodLabel).toBe('2026');
    expect(doc.pauschale).toBe('ehrenamt');
    expect(doc.lastActionDate).toBeInstanceOf(Date);
  });
});

describe('mapInvoiceToBoardDoc', () => {
  it('maps an invoice to a board document', () => {
    const doc = mapInvoiceToBoardDoc(makeInvoice({}), 'ehrenamt', 'de');
    expect(doc.status).toBe('timesheet-signing-vol');
    expect(doc.amount).toBe(120);
    expect(doc.hours).toBe(8);
    expect(doc.periodLabel).toContain('2026');
    expect(doc.pauschale).toBe('ehrenamt');
  });
});

describe('contractPeriodOverlapsYear', () => {
  it('returns true when contract overlaps year', () => {
    expect(contractPeriodOverlapsYear(makeContract({}), 2026)).toBe(true);
    expect(
      contractPeriodOverlapsYear(
        makeContract({ periodStart: '2025-07-01', periodEnd: '2026-06-30' }),
        2026,
      ),
    ).toBe(true);
  });

  it('returns false when contract is in a different year', () => {
    expect(
      contractPeriodOverlapsYear(
        makeContract({ periodStart: '2025-01-01', periodEnd: '2025-12-31' }),
        2026,
      ),
    ).toBe(false);
  });
});

describe('invoiceInMonth', () => {
  it('matches invoice period start to month', () => {
    expect(invoiceInMonth(makeInvoice({}), 2026, 6)).toBe(true); // July is 6
    expect(invoiceInMonth(makeInvoice({}), 2026, 5)).toBe(false);
    expect(invoiceInMonth(makeInvoice({}), 2025, 6)).toBe(false);
  });
});

describe('formatMonthYear', () => {
  it('formats with locale', () => {
    expect(formatMonthYear(new Date(2026, 6, 1), 'de')).toContain('Juli');
    expect(formatMonthYear(new Date(2026, 6, 1), 'en')).toContain('July');
  });
});

describe('monthsInRange', () => {
  it('returns current month when no range', () => {
    const months = monthsInRange(2026, undefined);
    expect(months.length).toBe(1);
    expect(months[0]?.year).toBe(new Date().getFullYear());
  });

  it('returns all months between from and to inclusive', () => {
    const months = monthsInRange(2026, {
      from: new Date(2026, 5, 15),
      to: new Date(2026, 7, 10),
    });
    expect(months.map((m) => m.month)).toEqual([5, 6, 7]);
  });
});

describe('buildBoardVolunteers', () => {
  it('synthesizes contract-generate when no contract exists', () => {
    const volunteers = buildBoardVolunteers({
      rosterUsage: [
        {
          volunteer: { id: 'v-1', name: 'Anna Müller', image: null },
          usageByType: [
            {
              usedCents: 0,
              limitCents: 84_000,
              remainingCents: 84_000,
              reimbursementType: ehrenamtType,
            },
          ],
        },
      ],
      contracts: [],
      invoices: [],
      year: 2026,
      locale: 'de',
    });
    expect(volunteers).toHaveLength(1);
    expect(volunteers[0]?.documents[0]?.status).toBe('contract-generate');
  });

  it('synthesizes timesheet-generate for active contract with no invoice', () => {
    const volunteers = buildBoardVolunteers({
      rosterUsage: [
        {
          volunteer: { id: 'v-1', name: 'Anna Müller', image: null },
          usageByType: [
            {
              usedCents: 0,
              limitCents: 84_000,
              remainingCents: 84_000,
              reimbursementType: ehrenamtType,
            },
          ],
        },
      ],
      contracts: [
        makeContract({
          id: 'c-active',
          contractStatus: ContractStatus.Active,
        }),
      ],
      invoices: [],
      year: 2026,
      locale: 'de',
      dateRange: { from: new Date(2026, 6, 1), to: new Date(2026, 6, 31) },
    });
    const docs = volunteers[0]?.documents ?? [];
    expect(docs.some((d) => d.status === 'contract-active')).toBe(true);
    expect(docs.some((d) => d.status === 'timesheet-generate')).toBe(true);
  });

  it('maps existing invoices and skips generate for that month', () => {
    const volunteers = buildBoardVolunteers({
      rosterUsage: [
        {
          volunteer: { id: 'v-1', name: 'Anna Müller', image: null },
          usageByType: [
            {
              usedCents: 12_000,
              limitCents: 84_000,
              remainingCents: 72_000,
              reimbursementType: ehrenamtType,
            },
          ],
        },
      ],
      contracts: [
        makeContract({
          id: 'c-active',
          contractStatus: ContractStatus.Active,
        }),
      ],
      invoices: [makeInvoice({ invoiceStatus: InvoiceStatus.Ready })],
      year: 2026,
      locale: 'de',
      dateRange: { from: new Date(2026, 6, 1), to: new Date(2026, 6, 31) },
    });
    const docs = volunteers[0]?.documents ?? [];
    expect(docs.filter((d) => d.status === 'timesheet-ready')).toHaveLength(1);
    expect(docs.filter((d) => d.status === 'timesheet-generate')).toHaveLength(
      0,
    );
  });
});

describe('boardYear', () => {
  it('uses from year, then to year, then current year', () => {
    expect(boardYear({ from: new Date(2025, 0, 1) })).toBe(2025);
    expect(boardYear({ to: new Date(2024, 0, 1) })).toBe(2024);
    expect(boardYear(undefined)).toBe(new Date().getFullYear());
  });
});
