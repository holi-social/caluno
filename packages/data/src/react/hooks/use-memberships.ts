'use client';

import { OrganizationRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useGraphQLClient } from './use-graphql-client';

export function useVolunteers(orgUId: string) {
  const client = useGraphQLClient();
  const repository = new OrganizationRepository(client);

  return useQuery({
    queryKey: ['volunteers', orgUId],
    queryFn: () => repository.findVolunteersByUnit(orgUId),
  });
}
