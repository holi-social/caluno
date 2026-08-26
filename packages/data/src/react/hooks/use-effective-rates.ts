'use client';
import { AccountingRepository, type RawEffectiveRate } from '@repo/data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useEffectiveRates(organizationUnitId?: string) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<RawEffectiveRate[]>({
    queryKey: ['accounting', 'effective-rates', organizationUnitId],
    queryFn: () => repository.findEffectiveRates(organizationUnitId),
    staleTime: 30 * 1000,
    enabled: !!organizationUnitId,
  });
}

export function useSetReimbursementRate() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new AccountingRepository(sdk);

  return useMutation({
    mutationFn: (input: {
      reimbursementTypeId: string;
      hourlyRateCents: number;
      organizationUnitId?: string;
    }) => repository.setReimbursementRate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['accounting', 'effective-rates'],
      });
    },
  });
}
