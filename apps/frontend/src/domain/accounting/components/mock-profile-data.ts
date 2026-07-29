// Mock lookup standing in for the requirement profile — real wiring is a dev
// dependency (SF-2/requirement-profile data, not built in this prototype).
// Shared by ContractCreationModal and InvoiceCreationModal so both demo the
// same volunteers consistently. Keyed to real board rows in
// reimbursements-board.tsx: v3 (Clara Weber) and v10 (Jonas Bauer) are fully
// populated; v9 (Ida Koch) and v12 (Lena Klein) each have a genuine gap to
// exercise that state. Any other volunteer id falls back to
// DEFAULT_PROFILE_DATA — every "Create" action stays testable, not just the
// four seeded ids.
export interface ProfileMockData {
  address: string | null;
  iban: string | null;
  bic: string | null;
  dob: string | null;
  taxId: string | null;
}

const CLARA_WEBER_PROFILE: ProfileMockData = {
  address: 'Musterstraße 12, 10115 Berlin',
  iban: 'DE89 3704 0044 0532 0130 00',
  bic: 'COBADEFFXXX',
  dob: '14.03.1998',
  taxId: '12 345 678 901',
};

export const MOCK_PROFILE_DATA: Record<string, ProfileMockData> = {
  v3: CLARA_WEBER_PROFILE,
  v9: {
    address: 'Beispielweg 4, 20095 Hamburg',
    iban: 'DE12 5001 0517 0648 4898 90',
    bic: 'HASPDEHHXXX',
    dob: '02.11.1985',
    taxId: null,
  },
  v10: {
    address: 'Ahornallee 7, 04109 Leipzig',
    iban: 'DE45 8605 5592 0290 1490 70',
    bic: 'WELADE8LXXX',
    dob: '23.09.1992',
    taxId: '98 765 432 109',
  },
  v12: {
    address: 'Lindenweg 19, 50667 Köln',
    iban: null,
    bic: null,
    dob: '11.06.2000',
    taxId: '55 443 322 110',
  },
};

/** Fallback for any volunteer id not seeded above, so every Create action resolves. */
export const DEFAULT_PROFILE_DATA: ProfileMockData = CLARA_WEBER_PROFILE;
