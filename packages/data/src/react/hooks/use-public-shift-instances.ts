'use client';

import { ShiftRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function usePublicShiftInstances(shiftId: string) {
  const sdk = useSdk();
  const repository = new ShiftRepository(sdk);

  return useQuery({
    queryKey: ['publicShiftInstances', shiftId],
    queryFn: () => repository.findPublicInstancesByShiftId(shiftId),
    staleTime: 30 * 1000,
  });
}
