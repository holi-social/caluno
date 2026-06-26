'use client';

import { type FormBlock, RequirementFormRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useBlock(id: string) {
  const sdk = useSdk();
  const repository = new RequirementFormRepository(sdk);

  return useQuery<FormBlock>({
    queryKey: ['block', id],
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
