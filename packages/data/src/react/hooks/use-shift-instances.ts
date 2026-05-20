'use client';

import { ShiftRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useGraphQLClient } from './use-graphql-client';

export function useShiftInstances(shiftId: string) {
  const client = useGraphQLClient();
  const repository = new ShiftRepository(client);

  return useQuery({
    queryKey: ['shiftInstances', shiftId],
    queryFn: () => repository.findByShiftId(shiftId),
    enabled: !!shiftId,
  });
}
