'use client';
import {
  AccountingRepository,
  type RawAccountingSetupStatus,
} from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useAccountingSetupStatus() {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<RawAccountingSetupStatus>({
    queryKey: ['accounting', 'setup-status'],
    queryFn: () => repository.findAccountingSetupStatus(),
    staleTime: 30 * 1000,
  });
}
