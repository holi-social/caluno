'use client';

import { ShiftRepository, type WeeklyShiftInstance } from '@repo/data';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useWeeklyShifts(
  startsAfter: Date,
  endsBefore: Date,
  eventId?: string | null,
) {
  const sdk = useSdk();
  const repository = new ShiftRepository(sdk);

  return useSuspenseQuery<WeeklyShiftInstance[]>({
    queryKey: [
      'weeklyShifts',
      startsAfter.toISOString(),
      endsBefore.toISOString(),
      eventId ?? null,
    ],
    queryFn: () => repository.findForWeek(startsAfter, endsBefore, eventId),
    staleTime: 30 * 1000,
  });
}
