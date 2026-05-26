'use client';

import { MembershipRepository } from '@repo/data';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useGraphQLClient } from './use-graphql-client';

export function useMemberships(orgUId: string) {
  const client = useGraphQLClient();
  const repository = new MembershipRepository(client);

  return useQuery({
    queryKey: ['memberships', orgUId],
    queryFn: () => repository.findAllByOrganizationUnitId(),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useUpdateMembershipRoles() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new MembershipRepository(client);

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
