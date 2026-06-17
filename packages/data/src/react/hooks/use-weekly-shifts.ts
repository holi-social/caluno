'use client';

import { ShiftRepository, type WeeklyShiftInstance } from '@repo/data';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useWeeklyShifts(from: Date, to: Date) {
  const sdk = useSdk();
  const repository = new ShiftRepository(sdk);

  return useSuspenseQuery<WeeklyShiftInstance[]>({
    queryKey: ['weeklyShifts', from.toISOString(), to.toISOString()],
    queryFn: () => repository.findForWeek(from, to),
    staleTime: 30 * 1000,
  });
}
