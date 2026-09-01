'use client';

import { useQuery } from '@tanstack/react-query';
import { ShiftRepository } from '../../repositories/shift/shift.repository';
import { useSdk } from './use-graphql-client';

/**
 * Shift-name search for the "found on other days" section. Idle until the
 * admin has typed enough to make the result meaningful.
 */
export function useCheckInShifts(organizationUnitId: string, search: string) {
  const sdk = useSdk();
  const repository = new ShiftRepository(sdk);
  const trimmed = search.trim();

  return useQuery({
    queryKey: ['check-in-shifts', organizationUnitId, trimmed],
    queryFn: () => repository.findCheckInShifts(organizationUnitId, trimmed),
    enabled: !!organizationUnitId && trimmed.length >= 2,
  });
}
