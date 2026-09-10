'use client';
import {
  AccountingRepository,
  type RawVolunteerInviteAllowance,
  type RawVolunteerYearlyUsage,
  type RawYearlyUsage,
} from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useYearlyUsage(reimbursementTypeId?: string, year?: number) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<RawYearlyUsage>({
    queryKey: ['accounting', 'yearly-usage', reimbursementTypeId, year],
    queryFn: () =>
      repository.findYearlyUsage(reimbursementTypeId ?? '', year ?? 0),
    staleTime: 30 * 1000,
    enabled: !!reimbursementTypeId && !!year,
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
