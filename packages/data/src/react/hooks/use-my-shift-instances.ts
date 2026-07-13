'use client';

import { ShiftRepository } from '@repo/data';
import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useMyShiftInstances(
  includePast = false,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<ShiftRepository['findMyShiftInstances']>>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const sdk = useSdk();
  const repository = new ShiftRepository(sdk);

  return useQuery({
    queryKey: ['myShiftInstances', includePast],
    queryFn: () => repository.findMyShiftInstances(includePast),
    staleTime: 30 * 1000,
    ...options,
  });
}
