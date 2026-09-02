'use client';
import {
  AccountingRepository,
  type RawVolunteerNeedsTimesheet,
} from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useVolunteersNeedingTimesheets(input: {
  periodStart?: string;
  periodEnd?: string;
}) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<RawVolunteerNeedsTimesheet[]>({
    queryKey: ['accounting', 'volunteers-needing-timesheets', input],
    queryFn: () => repository.findVolunteersNeedingTimesheets(input),
    staleTime: 30 * 1000,
    enabled: !!input.periodStart || !!input.periodEnd,
  });
}
