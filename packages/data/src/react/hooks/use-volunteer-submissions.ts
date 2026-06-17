'use client';

import { RequirementFormRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useFormSubmissionsForVolunteer(userId: string) {
  const sdk = useSdk();
  const repository = new RequirementFormRepository(sdk);

  return useQuery({
    queryKey: ['formSubmissionsForVolunteer', userId],
    queryFn: () => repository.findSubmissionsForVolunteer(userId),
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}
