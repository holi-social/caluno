'use client';

import { useQuery } from '@tanstack/react-query';
import { ShiftRepository } from '../../repositories/shift/shift.repository';
import { useSdk } from './use-graphql-client';

export function useCheckInShiftInstances(
  organizationUnitId: string,
  startsAfter: Date,
  endsBefore: Date,
) {
  const sdk = useSdk();
  const repository = new ShiftRepository(sdk);

  return useQuery({
    queryKey: [
      'check-in-shift-instances',
      organizationUnitId,
      startsAfter.toISOString(),
      endsBefore.toISOString(),
    ],
    queryFn: () =>
      repository.findCheckInInstances(
        organizationUnitId,
        startsAfter,
        endsBefore,
      ),
    enabled: !!organizationUnitId,
    staleTime: 30 * 1000,
  });
}
