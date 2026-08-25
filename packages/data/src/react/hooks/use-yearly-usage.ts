'use client';
import {
  AccountingRepository,
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
  });
}
