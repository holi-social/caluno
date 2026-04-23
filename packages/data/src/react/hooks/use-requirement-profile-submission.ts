'use client';

import {
  type CreateRequirementProfileSubmissionInput,
  RequirementProfileRepository,
} from '@repo/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGraphQLClient } from './use-graphql-client';

export function useCreateRequirementProfileSubmission() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new RequirementProfileRepository(client);

  return useMutation({
    mutationFn: (input: CreateRequirementProfileSubmissionInput) =>
      repository.createSubmission(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['requirementProfileSubmissions'],
      });
    },
  });
}
