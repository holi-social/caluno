'use client';

import { useQuery } from '@tanstack/react-query';
import { OrganizationRepository } from '../../repositories/organization/organization.repository';
import { useSdk } from './use-graphql-client';

export function useOrganizationVolunteers(organizationUnitId: string) {
  const sdk = useSdk();
  const repository = new OrganizationRepository(sdk);

  return useQuery({
    queryKey: ['organization-volunteers', organizationUnitId],
    queryFn: () => repository.findVolunteersByUnit(organizationUnitId),
    enabled: !!organizationUnitId,
  });
}
