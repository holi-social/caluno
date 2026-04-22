'use client';

import { ShiftRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useGraphQLClient } from './use-graphql-client';

export function useShiftVolunteers(shiftId: string) {
  const client = useGraphQLClient();
  const repository = new ShiftRepository(client);

  return useQuery({
    queryKey: ['shiftVolunteers', shiftId],
    queryFn: () => repository.findVolunteersByShiftId(shiftId),
    enabled: !!shiftId,
  });
}
