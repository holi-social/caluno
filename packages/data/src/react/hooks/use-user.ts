'use client';

import { UserRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useUser(userId: string) {
  const sdk = useSdk();
  const repository = new UserRepository(sdk);

  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => repository.findById(userId),
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}
