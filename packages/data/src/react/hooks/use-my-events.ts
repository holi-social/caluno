'use client';

import { EventRepository } from '@repo/data';
import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { EventInviteStatus, SortOrder } from '../../generated/graphql';
import { useSdk } from './use-graphql-client';

export function useMyEvents(
  options: {
    includePast?: boolean;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
    order?: SortOrder;
    statuses?: EventInviteStatus[];
  } = {},
  queryOptions?: Omit<
    UseQueryOptions<Awaited<ReturnType<EventRepository['findMyEvents']>>>,
    'queryKey' | 'queryFn'
  >,
) {
  const sdk = useSdk();
  const repository = new EventRepository(sdk);

  return useQuery({
    queryKey: ['myEvents', options],
    queryFn: () => repository.findMyEvents(options),
    staleTime: 30 * 1000,
    ...queryOptions,
  });
}
