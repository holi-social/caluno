'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ShiftRepository } from '../../repositories/shift/shift.repository';
import { useSdk } from './use-graphql-client';

/**
 * Shift instances across every shift in the caller's organization unit that
 * fall within the given range. Scoped by the request's `x-organization-unit-id`
 * header, which the `DataProvider` injects globally on admin routes.
 *
 * Used by the "Add time entry" shift picker so the admin can pick an
 * occurrence (with its date) rather than a shift series.
 */
export function useTimeEntryShiftInstances(
  startsAfter: Date,
  endsBefore: Date,
) {
  const sdk = useSdk();
  const repository = new ShiftRepository(sdk);

  return useQuery({
    queryKey: [
      'timeEntryShiftInstances',
      startsAfter.toISOString(),
      endsBefore.toISOString(),
    ],
    queryFn: () => repository.findForWeek(startsAfter, endsBefore),
    staleTime: 30 * 1000,
    // Keep the previous range's instances while a new month is fetched so the
    // list never flashes empty when the admin changes the date.
    placeholderData: keepPreviousData,
  });
}
