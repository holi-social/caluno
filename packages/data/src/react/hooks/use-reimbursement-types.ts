'use client';
import { AccountingRepository, type RawReimbursementType } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useReimbursementTypes() {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<RawReimbursementType[]>({
    queryKey: ['accounting', 'reimbursement-types'],
    queryFn: () => repository.findReimbursementTypes(),
    staleTime: 5 * 60 * 1000,
  });
}
