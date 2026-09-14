'use client';
import {
  AccountingRepository,
  type RawVolunteerInviteAllowance,
  type RawVolunteerYearlyUsage,
  type RawYearlyUsage,
} from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useYearlyUsage(input: {
  volunteerId?: string;
  reimbursementTypeId?: string;
  year?: number;
  /** ISO timestamp — bounds the sum to invoices whose period ended by then. */
  asOfDate?: string;
  /** A single invoice to omit from the sum (the document being previewed). */
  excludeInvoiceId?: string;
}) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);
  const { volunteerId, reimbursementTypeId, year, asOfDate, excludeInvoiceId } =
    input;

  return useQuery<RawYearlyUsage>({
    queryKey: [
      'accounting',
      'yearly-usage',
      volunteerId,
      reimbursementTypeId,
      year,
      asOfDate,
      excludeInvoiceId,
    ],
    queryFn: () =>
      repository.findYearlyUsage({
        volunteerId: volunteerId ?? '',
        reimbursementTypeId: reimbursementTypeId ?? '',
        year: year ?? 0,
        asOfDate,
        excludeInvoiceId,
      }),
    staleTime: 30 * 1000,
    enabled: !!volunteerId && !!reimbursementTypeId && !!year,
  });
}

export function useRosterYearlyUsage(
  organizationUnitId?: string,
  year?: number,
) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<RawVolunteerYearlyUsage[]>({
    queryKey: ['accounting', 'roster-usage', organizationUnitId, year],
    queryFn: () =>
      repository.findRosterYearlyUsage(organizationUnitId ?? '', year ?? 0),
    staleTime: 30 * 1000,
    enabled: !!organizationUnitId && !!year,
    refetchOnMount: 'always',
  });
}

/**
 * Per-volunteer allowance state for the "invite volunteers" list on a paid
 * shift (VOLI-1248). Only meaningful — and only enabled — when the shift is
 * paid under a known reimbursement type; an unpaid shift never enables this,
 * so its invite list is unaffected.
 */
export function useInviteAllowanceEligibility(input: {
  organizationUnitId?: string;
  reimbursementTypeId?: string;
  shiftDurationMinutes?: number;
}) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);
  const { organizationUnitId, reimbursementTypeId, shiftDurationMinutes } =
    input;

  return useQuery<RawVolunteerInviteAllowance[]>({
    queryKey: [
      'accounting',
      'invite-allowance-eligibility',
      organizationUnitId,
      reimbursementTypeId,
      shiftDurationMinutes,
    ],
    queryFn: () =>
      repository.findInviteAllowanceEligibility({
        organizationUnitId: organizationUnitId ?? '',
        reimbursementTypeId: reimbursementTypeId ?? '',
        shiftDurationMinutes: shiftDurationMinutes ?? 0,
      }),
    staleTime: 30 * 1000,
    enabled: Boolean(
      organizationUnitId && reimbursementTypeId && shiftDurationMinutes,
    ),
  });
}
