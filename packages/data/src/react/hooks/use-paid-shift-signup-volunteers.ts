'use client';
import {
  AccountingRepository,
  type RawPaidShiftSignupVolunteer,
} from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function usePaidShiftSignupVolunteers(year?: number) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<RawPaidShiftSignupVolunteer[]>({
    queryKey: ['accounting', 'paid-shift-signup-volunteers', year],
    queryFn: () => repository.findPaidShiftSignupVolunteers(year ?? 0),
    staleTime: 30 * 1000,
    enabled: !!year,
    refetchOnMount: 'always',
  });
}
