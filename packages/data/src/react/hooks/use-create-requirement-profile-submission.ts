'use client';

import { RequirementProfileRepository } from '@repo/data';
import { useMutation } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useCreateRequirementProfileSubmission() {
  const sdk = useSdk();
  const repository = new RequirementProfileRepository(sdk);

  return useMutation({
    mutationFn: (input: {
      profileId: string;
      membershipRequestId?: string | null;
      fulfillments: Array<{
        requirementId: string;
        fileId: string;
      }>;
    }) =>
      repository.createSubmission({
        profileId: input.profileId,
        membershipRequestId: input.membershipRequestId ?? null,
        fulfillments: input.fulfillments.map((fulfillment) => ({
          requirementId: fulfillment.requirementId,
          fileId: fulfillment.fileId,
        })),
      }),
  });
}
