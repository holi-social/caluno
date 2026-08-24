'use client';

import { EventRepository } from '@repo/data';
import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useAvailableEvents(
  options: {
    startsAfter?: Date;
    endsBefore?: Date;
    organizationUnitIds?: string[];
    limit?: number;
    offset?: number;
  } = {},
  queryOptions?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<EventRepository['findAvailableEvents']>>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const sdk = useSdk();
  const repository = new EventRepository(sdk);

  return useQuery({
    queryKey: ['availableEvents', options],
    queryFn: () => repository.findAvailableEvents(options),
    staleTime: 30 * 1000,
    ...queryOptions,
  });
}
