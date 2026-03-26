'use client';

import { UserRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useGraphQLClient } from './use-graphql-client';

export function useMyPermissions() {
  const client = useGraphQLClient();
  const repository = new UserRepository(client);

  return useQuery({
    queryKey: ['user', 'me', 'permissions'],
    queryFn: () => repository.getMyPermissions(),
    staleTime: 30 * 1000,
  });
}

export function useHasPermission(key: string): boolean {
  const { data: permissions } = useMyPermissions();
  return permissions?.some((p) => p.key === key) ?? false;
}
