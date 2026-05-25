'use client';

import { OrganizationRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useVolunteers(orgUId: string) {
  const sdk = useSdk();
  const repository = new OrganizationRepository(sdk);

  return useQuery({
    queryKey: ['volunteers', orgUId],
    queryFn: () => repository.findVolunteersByUnit(orgUId),
  });
}
