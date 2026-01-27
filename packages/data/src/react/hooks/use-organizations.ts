'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrganizationRepository, type CreateOrganizationInput } from '@repo/data';
import { useGraphQLClient } from './use-graphql-client';

export function useOrganizations(limit = 10, offset = 0) {
  const client = useGraphQLClient();
  const repository = new OrganizationRepository(client);

  return useQuery({
    queryKey: ['organizations', { limit, offset }],
    queryFn: () => repository.findAll({ limit, offset }),
  });
}

export function useOrganization(id: string) {
  const client = useGraphQLClient();
  const repository = new OrganizationRepository(client);

  return useQuery({
    queryKey: ['organization', id],
    queryFn: () => repository.findById(id),
    enabled: !!id,
  });
}

export function useOrganizationBySlug(slug: string) {
  const client = useGraphQLClient();
  const repository = new OrganizationRepository(client);

  return useQuery({
    queryKey: ['organization', 'slug', slug],
    queryFn: () => repository.findBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateOrganization() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new OrganizationRepository(client);

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => repository.create(input),
    onSuccess: () => {
      // Invalidate organizations list to refetch
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}
