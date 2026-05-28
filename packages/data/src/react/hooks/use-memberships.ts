'use client';

import { MembershipRepository } from '@repo/data';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useMemberships(orgUId: string) {
  const sdk = useSdk();
  const repository = new MembershipRepository(sdk);

  return useQuery({
    queryKey: ['memberships', orgUId],
    queryFn: () => repository.findAllByOrganizationUnitId(),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useUpdateMembershipRoles() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new MembershipRepository(sdk);

  return useMutation({
    mutationFn: ({
      membershipId,
      roleIds,
    }: {
      membershipId: string;
      roleIds: string[];
    }) => repository.updateRoles(membershipId, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['memberships'],
      });
    },
  });
}
