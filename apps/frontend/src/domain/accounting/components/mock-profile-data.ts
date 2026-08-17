// Mock lookup standing in for the requirement profile — real wiring is a dev
// dependency (SF-2/requirement-profile data, not built in this prototype).
// Shared by ContractCreationModal and InvoiceCreationModal so both demo the
// same volunteers consistently. Keyed to real board rows in
// reimbursements-board.tsx: v3 (Clara Weber) is fully populated; v2 (Ben
// Schmidt) hasn't shared address/banking yet; v4 (David Fischer) is missing
// just his BIC. Any other volunteer id falls back to DEFAULT_PROFILE_DATA.
export interface ProfileMockData {
  address: string | null;
  iban: string | null;
  bic: string | null;
  dob: string | null;
}

const CLARA_WEBER_PROFILE: ProfileMockData = {
  address: 'Musterstraße 12, 10115 Berlin',
  iban: 'DE89 3704 0044 0532 0130 00',
  bic: 'COBADEFFXXX',
  dob: '14.03.1998',
};

export const MOCK_PROFILE_DATA: Record<string, ProfileMockData> = {
  v2: {
    address: null,
    iban: null,
    bic: null,
    dob: '15.09.2001',
  },
  v3: CLARA_WEBER_PROFILE,
  v4: {
    address: 'Ahornallee 7, 04109 Leipzig',
    iban: 'DE45 8605 5592 0290 1490 70',
    bic: null,
    dob: '23.09.1992',
  },
};

/** Fallback for any volunteer id not seeded above, so every Create action resolves. */
export const DEFAULT_PROFILE_DATA: ProfileMockData = CLARA_WEBER_PROFILE;
