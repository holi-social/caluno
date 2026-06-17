'use client';

import { RequirementProfileRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useAdminUserProfile(userId: string) {
  const sdk = useSdk();
  const repository = new RequirementProfileRepository(sdk);

  return useQuery({
    queryKey: ['adminUserProfile', userId],
    queryFn: () => repository.getAdminUserProfile(userId),
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}
