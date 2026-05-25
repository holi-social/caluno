'use client';

import { MembershipRequestRepository } from '@repo/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useApproveMembershipRequest() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new MembershipRequestRepository(sdk);

  return useMutation({
    mutationFn: ({
      id,
      organizationUnitId,
    }: {
      id: string;
      organizationUnitId: string;
    }) => repository.approve(id, organizationUnitId),
    onSuccess: (_, { organizationUnitId }) => {
      queryClient.invalidateQueries({
        queryKey: ['membershipRequests', organizationUnitId],
      });
    },
  });
}

export function useCancelMembershipRequest() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new MembershipRequestRepository(sdk);

  return useMutation({
    mutationFn: ({
      id,
      organizationUnitId,
    }: {
      id: string;
      organizationUnitId: string;
    }) => repository.cancel(id, organizationUnitId),
    onSuccess: (_, { organizationUnitId }) => {
      queryClient.invalidateQueries({
        queryKey: ['membershipRequests', organizationUnitId],
      });
    },
  });
}
