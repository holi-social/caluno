'use client';
import { AccountingRepository, type RawManualBaseline } from '@repo/data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useManualBaseline(
  volunteerId?: string,
  reimbursementTypeId?: string,
  year?: number,
) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<RawManualBaseline>({
    queryKey: [
      'accounting',
      'manual-baseline',
      volunteerId,
      reimbursementTypeId,
      year,
    ],
    queryFn: () =>
      repository.findManualBaseline(
        volunteerId ?? '',
        reimbursementTypeId ?? '',
        year ?? new Date().getFullYear(),
      ),
    staleTime: 30 * 1000,
    enabled: !!volunteerId && !!reimbursementTypeId && !!year,
  });
}

export function useSetManualBaseline() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new AccountingRepository(sdk);

  return useMutation({
    mutationFn: (input: {
      volunteerId: string;
      reimbursementTypeId: string;
      year: number;
      amountCents: number;
    }) => repository.setManualBaseline(input),
    onSuccess: (_, { volunteerId, reimbursementTypeId, year }) => {
      queryClient.invalidateQueries({
        queryKey: [
          'accounting',
          'manual-baseline',
          volunteerId,
          reimbursementTypeId,
          year,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ['accounting', 'yearly-usage'],
      });
      queryClient.invalidateQueries({
        queryKey: ['accounting', 'roster-usage'],
      });
    },
  });
}
