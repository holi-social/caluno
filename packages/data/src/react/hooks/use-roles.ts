'use client';

import { RoleRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function usePermissions() {
  const sdk = useSdk();
  const repository = new RoleRepository(sdk);

  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => repository.findAllPermissions(),
  });
}

export function usePermissionGroups() {
  const sdk = useSdk();
  const repository = new RoleRepository(sdk);

  return useQuery({
    queryKey: ['permissionGroups'],
    queryFn: () => repository.findPermissionGroups(),
  });
}

export function useRoles() {
  const client = useGraphQLClient();
  const repository = new RoleRepository(client);

  return useQuery({
    queryKey: ['roles'],
    queryFn: () => repository.findAll(),
  });
}
