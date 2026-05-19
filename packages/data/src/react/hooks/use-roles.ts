'use client';

import { RoleRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useGraphQLClient } from './use-graphql-client';

export function usePermissions() {
  const client = useGraphQLClient();
  const repository = new RoleRepository(client);

  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => repository.findAllPermissions(),
  });
}

export function usePermissionGroups() {
  const client = useGraphQLClient();
  const repository = new RoleRepository(client);

  return useQuery({
    queryKey: ['permissionGroups'],
    queryFn: () => repository.findPermissionGroups(),
  });
}
