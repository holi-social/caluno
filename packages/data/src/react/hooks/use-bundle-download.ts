'use client';
import { AccountingRepository, type RawBundleDownloadStatus } from '@repo/data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useBundleDownloadStatus(
  volunteerId?: string,
  reimbursementTypeId?: string,
) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<RawBundleDownloadStatus>({
    queryKey: [
      'accounting',
      'bundle-download-status',
      volunteerId,
      reimbursementTypeId,
    ],
    queryFn: () =>
      repository.findBundleDownloadStatus(
        volunteerId ?? '',
        reimbursementTypeId ?? '',
      ),
    staleTime: 30 * 1000,
    enabled: !!volunteerId && !!reimbursementTypeId,
  });
}

export function useRecordBundleDownload() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new AccountingRepository(sdk);

  return useMutation({
    mutationFn: ({
      volunteerId,
      reimbursementTypeId,
    }: {
      volunteerId: string;
      reimbursementTypeId: string;
    }) => repository.recordBundleDownload(volunteerId, reimbursementTypeId),
    onSuccess: (_, { volunteerId, reimbursementTypeId }) => {
      queryClient.invalidateQueries({
        queryKey: [
          'accounting',
          'bundle-download-status',
          volunteerId,
          reimbursementTypeId,
        ],
      });
    },
  });
}
