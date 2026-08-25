'use client';

import { useQuery } from '@tanstack/react-query';
import { RequirementFormRepository } from '../../repositories/requirementForm/requirement-form.repository';
import { useSdk } from './use-graphql-client';

export function useRequirementForms(organizationId: string) {
  const sdk = useSdk();
  const repository = new RequirementFormRepository(sdk);

  return useQuery({
    queryKey: ['requirementForms', organizationId],
    queryFn: () =>
      repository.findForms(organizationId, { limit: 100, offset: 0 }),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}
