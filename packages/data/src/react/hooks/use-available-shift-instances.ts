'use client';

import { ShiftRepository } from '@repo/data';
import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useAvailableShiftInstances(
  options: {
    startsAfter?: Date;
    endsBefore?: Date;
    organizationUnitIds?: string[];
    limit?: number;
    offset?: number;
  } = {},
  queryOptions?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<ShiftRepository['findAvailableShiftInstances']>>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const sdk = useSdk();
  const repository = new ShiftRepository(sdk);

  return useQuery({
    queryKey: ['availableShiftInstances', options],
    queryFn: () => repository.findAvailableShiftInstances(options),
    staleTime: 30 * 1000,
    ...queryOptions,
  });
}
