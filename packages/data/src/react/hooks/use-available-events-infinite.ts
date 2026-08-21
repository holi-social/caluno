'use client';

import { EventRepository } from '@repo/data';
import {
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export type AvailableEventsInfiniteResult = Awaited<
  ReturnType<EventRepository['findAvailableEvents']>
>;

export function useAvailableEventsInfinite(
  options: {
    startsAfter?: Date;
    endsBefore?: Date;
    organizationUnitIds?: string[];
    limit?: number;
  } = {},
  queryOptions?: Omit<
    UseInfiniteQueryOptions<
      AvailableEventsInfiniteResult,
      Error,
      InfiniteData<AvailableEventsInfiniteResult>,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >,
) {
  const sdk = useSdk();
  const repository = new EventRepository(sdk);
  const limit = options.limit ?? 15;

  return useInfiniteQuery<
    AvailableEventsInfiniteResult,
    Error,
    InfiniteData<AvailableEventsInfiniteResult>,
    QueryKey,
    number
  >({
    queryKey: ['availableEventsInfinite', options],
    queryFn: ({ pageParam }) =>
      repository.findAvailableEvents({
        ...options,
        limit,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined,
    staleTime: 30 * 1000,
    ...queryOptions,
  });
}
