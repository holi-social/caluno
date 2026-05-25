'use client';

import { ShiftRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useShiftVolunteers(shiftId: string) {
  const sdk = useSdk();
  const repository = new ShiftRepository(sdk);

  return useQuery({
    queryKey: ['shiftVolunteers', shiftId],
    queryFn: () => repository.findVolunteersByShiftId(shiftId),
    enabled: !!shiftId,
  });
}
