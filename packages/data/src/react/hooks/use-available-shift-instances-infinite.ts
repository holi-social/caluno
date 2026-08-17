'use client';

import { ShiftRepository } from '@repo/data';
import {
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export type AvailableShiftInstancesInfiniteResult = Awaited<
  ReturnType<ShiftRepository['findAvailableShiftInstances']>
>;

export function useAvailableShiftInstancesInfinite(
  options: {
    startsAfter?: Date;
    endsBefore?: Date;
    organizationUnitIds?: string[];
    limit?: number;
  } = {},
  queryOptions?: Omit<
    UseInfiniteQueryOptions<
      AvailableShiftInstancesInfiniteResult,
      Error,
      InfiniteData<AvailableShiftInstancesInfiniteResult>,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >,
) {
  const sdk = useSdk();
  const repository = new ShiftRepository(sdk);
  const limit = options.limit ?? 15;

  return useInfiniteQuery<
    AvailableShiftInstancesInfiniteResult,
    Error,
    InfiniteData<AvailableShiftInstancesInfiniteResult>,
    QueryKey,
    number
  >({
    queryKey: ['availableShiftInstancesInfinite', options],
    queryFn: ({ pageParam }) =>
      repository.findAvailableShiftInstances({
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
