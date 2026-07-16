'use client';

import { ShiftRepository } from '@repo/data';
import {
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
  useInfiniteQuery,
} from '@tanstack/react-query';
import type { SortOrder } from '../../generated/graphql';
import { useSdk } from './use-graphql-client';

export type MyShiftInstancesInfiniteResult = Awaited<
  ReturnType<ShiftRepository['findMyShiftInstances']>
>;

export function useMyShiftInstancesInfinite(
  options: {
    includePast?: boolean;
    from?: Date;
    to?: Date;
    order?: SortOrder;
    limit?: number;
  } = {},
  queryOptions?: Omit<
    UseInfiniteQueryOptions<
      MyShiftInstancesInfiniteResult,
      Error,
      InfiniteData<MyShiftInstancesInfiniteResult>,
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
    MyShiftInstancesInfiniteResult,
    Error,
    InfiniteData<MyShiftInstancesInfiniteResult>,
    QueryKey,
    number
  >({
    queryKey: ['myShiftInstancesInfinite', options],
    queryFn: ({ pageParam }) =>
      repository.findMyShiftInstances({
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
