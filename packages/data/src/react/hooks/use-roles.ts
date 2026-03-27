'use client';

import { type CreateRoleInput, RoleRepository } from '@repo/data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useGraphQLClient } from './use-graphql-client';

export function useRoles() {
  const client = useGraphQLClient();
  const repository = new RoleRepository(client);

  return useQuery({
    queryKey: ['roles'],
    queryFn: () => repository.findAll(),
  });
}

export function usePermissions() {
  const client = useGraphQLClient();
  const repository = new RoleRepository(client);

  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => repository.findAllPermissions(),
  });
}

export function useCreateRole() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new RoleRepository(client);

  return useMutation({
    mutationFn: (input: CreateRoleInput) => repository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useUpdateRole() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new RoleRepository(client);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateRoleInput }) =>
      repository.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({
        queryKey: ['user', 'me', 'permissions'],
      });
    },
  });
}

export function useDeleteRole() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new RoleRepository(client);

  return useMutation({
    mutationFn: (id: string) => repository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({
        queryKey: ['user', 'me', 'permissions'],
      });
    },
  });
}
