'use client';

import { OrganizationRepository } from '@repo/data';
import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useMyAccessibleOrganizationUnits(
  queryOptions?: Omit<
    UseQueryOptions<
      Awaited<
        ReturnType<OrganizationRepository['findMyAccessibleOrganizationUnits']>
      >
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const sdk = useSdk();
  const repository = new OrganizationRepository(sdk);

  return useQuery({
    queryKey: ['myAccessibleOrganizationUnits'],
    queryFn: () => repository.findMyAccessibleOrganizationUnits(),
    staleTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}
