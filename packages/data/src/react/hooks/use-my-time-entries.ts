'use client';

import { TimeEntryRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useMyTimeEntries(
  options: { limit?: number; offset?: number } = {},
) {
  const sdk = useSdk();
  const repository = new TimeEntryRepository(sdk);

  return useQuery({
    queryKey: ['myTimeEntries', options.limit, options.offset],
    queryFn: () => repository.findMyEntries(options),
  });
}
