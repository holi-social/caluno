'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
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
    // Keep the previous range's instances during a month/org-unit refetch so
    // consumers never see a spurious empty list (which would clear the
    // selection); `isPlaceholderData` tells them selection is stale.
    placeholderData: keepPreviousData,
  });
}
