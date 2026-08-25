'use client';

import { RequirementFormRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useMyFormSubmissions(organizationUnitId: string) {
  const sdk = useSdk();
  const repository = new RequirementFormRepository(sdk);

  return useQuery({
    queryKey: ['myFormSubmissions', organizationUnitId],
    queryFn: () => repository.findMyFormSubmissions(organizationUnitId),
    staleTime: 5 * 60 * 1000,
    enabled: !!organizationUnitId,
  });
}
