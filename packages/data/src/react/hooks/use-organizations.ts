'use client';

import {
  type CreateOrganizationInput,
  OrganizationRepository,
} from '@repo/data';
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { OrganizationUnitRepository } from '../../repositories/organization/organization-unit.repository';
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

export function useOrganizationUnit(id: string) {
  const client = useGraphQLClient();
  const repository = new OrganizationUnitRepository(client);

  return useQuery({
    queryKey: ['organization-unit', id],
    queryFn: () => repository.findById(id),
    enabled: !!id,
  });
}

export function useOrganizationUnitWithSuspense(id: string) {
  const client = useGraphQLClient();
  const repository = new OrganizationUnitRepository(client);

  return useSuspenseQuery({
    queryKey: ['organization-unit', id],
    queryFn: () => repository.findById(id),
  });
}
