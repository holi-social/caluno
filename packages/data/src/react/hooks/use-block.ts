'use client';

import { type FormBlock, RequirementFormRepository } from '@repo/data';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useSdk } from './use-graphql-client';

export function blockQueryKey(id: string) {
  return ['block', id] as const;
}

export function useBlock(id: string) {
  const sdk = useSdk();
  const repository = new RequirementFormRepository(sdk);

  return useQuery<FormBlock>({
    queryKey: blockQueryKey(id),
    queryFn: async () => {
      const block = await repository.findBlockById(id);
      if (!block) {
        throw new Error('Block not found');
      }
      return block;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/** Refetch block cache after server actions that mutate block data. */
export function useRefreshBlock() {
  const queryClient = useQueryClient();

  return useCallback(
    async (blockId: string) => {
      const queryKey = blockQueryKey(blockId);
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.refetchQueries({ queryKey });
    },
    [queryClient],
  );
}
