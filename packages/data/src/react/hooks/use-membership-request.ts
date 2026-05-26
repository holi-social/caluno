'use client';

import { MembershipRequestRepository } from '@repo/data';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MembershipRequestStatus } from '../../generated/graphql';
import { useGraphQLClient } from './use-graphql-client';

export function useMembershipRequests(
  organizationUnitId: string,
  status?: MembershipRequestStatus,
) {
  const client = useGraphQLClient();
  const repository = new MembershipRequestRepository(client);

  return useQuery({
    queryKey: ['membershipRequests', organizationUnitId, status],
    queryFn: () =>
      repository.findAllByOrganizationUnitId({
        status,
        limit: 100,
        offset: 0,
      }),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useMembershipRequestCount(
  organizationUnitId: string,
  status?: MembershipRequestStatus,
) {
  const client = useGraphQLClient();
  const repository = new MembershipRequestRepository(client);

  return useQuery({
    queryKey: ['membershipRequestCount', organizationUnitId, status],
    queryFn: () => repository.getCount(status),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useApproveMembershipRequest() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new MembershipRequestRepository(client);

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
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new MembershipRequestRepository(client);

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
