'use client';

import { useQuery } from '@tanstack/react-query';
import { TimeEntryRepository } from '../../repositories/time-entry/time-entry.repository';
import { useSdk } from './use-graphql-client';

export function useCheckInReadiness(
  organizationUnitId: string,
  volunteerId: string,
  shiftInstanceId: string | null,
) {
  const sdk = useSdk();
  const repository = new TimeEntryRepository(sdk);

  return useQuery({
    queryKey: [
      'check-in-readiness',
      organizationUnitId,
      volunteerId,
      shiftInstanceId,
    ],
    queryFn: () =>
      repository.getCheckInReadiness(
        organizationUnitId,
        volunteerId,
        // biome-ignore lint/style/noNonNullAssertion: `enabled` guards this
        shiftInstanceId!,
      ),
    enabled: !!organizationUnitId && !!volunteerId && !!shiftInstanceId,
  });
}
