'use client';

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { OrganizationUnitRepository } from '../../repositories/organization/organization-unit.repository';
import { useSdk } from './use-graphql-client';

export function useOrganizationUnitWithSuspense(id: string) {
  const sdk = useSdk();
  const repository = new OrganizationUnitRepository(sdk);

  return useSuspenseQuery({
    queryKey: ['organization-unit', id],
    queryFn: () => repository.findById(id),
  });
}

export function useIsMemberOfOrgUnitOrAncestor(organizationUnitId: string) {
  const sdk = useSdk();
  const repository = new OrganizationUnitRepository(sdk);

  return useQuery({
    queryKey: ['organization-unit', 'is-member', organizationUnitId],
    queryFn: () => repository.isMemberOfOrgUnitOrAncestor(organizationUnitId),
    enabled: !!organizationUnitId,
  });
}
