'use client';

import { useQuery } from '@tanstack/react-query';
import { TimeEntryRepository } from '../../repositories/time-entry/time-entry.repository';
import { useSdk } from './use-graphql-client';

/**
 * Enabled only while the accept-membership sheet is open — the sheet is the
 * only consumer, and there is no reason to keep this fetched otherwise.
 */
export function useCheckInVolunteerRequiredForms(
  organizationUnitId: string,
  volunteerId: string,
  enabled: boolean,
) {
  const sdk = useSdk();
  const repository = new TimeEntryRepository(sdk);

  return useQuery({
    queryKey: ['check-in-required-forms', organizationUnitId, volunteerId],
    queryFn: () =>
      repository.getCheckInVolunteerRequiredForms(
        organizationUnitId,
        volunteerId,
      ),
    enabled: !!organizationUnitId && !!volunteerId && enabled,
  });
}
