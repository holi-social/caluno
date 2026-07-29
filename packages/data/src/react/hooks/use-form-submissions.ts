'use client';

import { RequirementFormRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useFormSubmissionsByForm(formId: string) {
  const sdk = useSdk();
  const repository = new RequirementFormRepository(sdk);

  return useQuery({
    queryKey: ['formSubmissionsByForm', formId],
    queryFn: () => repository.findSubmissionsByForm(formId),
    staleTime: 5 * 60 * 1000,
    enabled: !!formId,
  });
}
