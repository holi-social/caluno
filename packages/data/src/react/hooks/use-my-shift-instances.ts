'use client';

import { ShiftRepository } from '@repo/data';
import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { ShiftInviteStatus, SortOrder } from '../../generated/graphql';
import { useSdk } from './use-graphql-client';

export function useMyShiftInstances(
  options: {
    includePast?: boolean;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
    order?: SortOrder;
    statuses?: ShiftInviteStatus[];
    includeIntended?: boolean;
  } = {},
  queryOptions?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<ShiftRepository['findMyShiftInstances']>>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const sdk = useSdk();
  const repository = new ShiftRepository(sdk);

  return useQuery({
    queryKey: ['myShiftInstances', options],
    queryFn: () => repository.findMyShiftInstances(options),
    staleTime: 30 * 1000,
    ...queryOptions,
  });
}
