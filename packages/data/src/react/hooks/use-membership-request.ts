'use client';

import {
  type FindMembershipRequestsOptions,
  MembershipRequestRepository,
} from '@repo/data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useGraphQLClient } from './use-graphql-client';

export function useMembershipRequests(
  organizationUnitId: string,
  { limit, offset, status }: FindMembershipRequestsOptions = {},
) {
  const client = useGraphQLClient();
  const repository = new MembershipRequestRepository(client);

  return useQuery({
    queryKey: [
      'membershipRequests',
      organizationUnitId,
      { limit, offset, status },
    ],
    queryFn: () =>
      repository.findAllByOrganizationUnitId(organizationUnitId, {
        limit,
        offset,
        status,
      }),
    enabled: !!organizationUnitId,
  });
}

export function useCreateMembershipRequest() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new MembershipRequestRepository(client);

  return useMutation({
    mutationFn: (organizationUnitId: string) =>
      repository.create(organizationUnitId),
    onSuccess: (_, organizationUnitId) => {
      queryClient.invalidateQueries({
        queryKey: ['membershipRequests', organizationUnitId],
      });
    },
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

export function useRejectMembershipRequest() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new MembershipRequestRepository(client);

  return useMutation({
    mutationFn: ({
      id,
      organizationUnitId,
      rejectionReason,
    }: {
      id: string;
      organizationUnitId: string;
      rejectionReason: string;
    }) => repository.reject(id, organizationUnitId, rejectionReason),
    onSuccess: (_, { organizationUnitId }) => {
      queryClient.invalidateQueries({
        queryKey: ['membershipRequests', organizationUnitId],
      });
    },
  });
}

export function useJoinOrganization() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new MembershipRequestRepository(client);

  return useMutation({
    mutationFn: (organizationUnitId: string) =>
      repository.join(organizationUnitId),
    onSuccess: (_, organizationUnitId) => {
      queryClient.invalidateQueries({
        queryKey: ['membershipRequests', organizationUnitId],
      });
      queryClient.invalidateQueries({
        queryKey: ['myMembershipRequests'],
      });
    },
  });
}

export function useMyMembershipRequests(
  options: FindMembershipRequestsOptions = {},
) {
  const client = useGraphQLClient();
  const repository = new MembershipRequestRepository(client);

  return useQuery({
    queryKey: ['myMembershipRequests', { ...options }],
    queryFn: () => repository.findMine({ ...options }),
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
