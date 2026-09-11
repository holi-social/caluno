'use client';

import { useQuery } from '@tanstack/react-query';
import { TimeEntryRepository } from '../../repositories/time-entry/time-entry.repository';
import { useSdk } from './use-graphql-client';

/**
 * `options.enabled` overrides the default guard, which waits for a shift
 * instance. Pass `true` for the check-in-without-shift mode, where a null
 * instance is the point and the query still answers the membership facts.
 */
export function useCheckInReadiness(
  organizationUnitId: string,
  volunteerId: string,
  shiftInstanceId: string | null,
  options?: { enabled?: boolean },
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
        shiftInstanceId,
      ),
    enabled:
      !!organizationUnitId &&
      !!volunteerId &&
      (options?.enabled ?? !!shiftInstanceId),
  });
}
