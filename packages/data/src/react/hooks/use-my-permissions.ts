'use client';

import type { PermissionKey } from '@repo/data';
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

export function useHasPermission(
  key: PermissionKey | PermissionKey[],
): boolean {
  const { data: permissions } = useMyPermissions();
  if (!permissions) return false;
  const keys = Array.isArray(key) ? key : [key];
  return keys.every((k) => permissions.some((p) => p.key === k));
}
