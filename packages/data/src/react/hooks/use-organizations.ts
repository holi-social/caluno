'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { OrganizationUnitRepository } from '../../repositories/organization/organization-unit.repository';
import { useGraphQLClient } from './use-graphql-client';

export function useOrganizationUnitWithSuspense(id: string) {
  const client = useGraphQLClient();
  const repository = new OrganizationUnitRepository(client);

  return useSuspenseQuery({
    queryKey: ['organization-unit', id],
    queryFn: () => repository.findById(id),
  });
}
