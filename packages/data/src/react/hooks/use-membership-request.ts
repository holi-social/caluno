'use client';

import { MembershipRequestRepository } from '@repo/data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useGraphQLClient } from './use-graphql-client';

export function useMembershipRequests(
  organizationId: string,
  limit = 10,
  offset = 0,
) {
  const client = useGraphQLClient();
  const repository = new MembershipRequestRepository(client);

  return useQuery({
    queryKey: ['membershipRequests', organizationId, { limit, offset }],
    queryFn: () =>
      repository.findAllByOrganizationId(organizationId, { limit, offset }),
    enabled: !!organizationId,
  });
}

export function useCreateMembershipRequest() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new MembershipRequestRepository(client);

  return useMutation({
    mutationFn: (organizationId: string) => repository.create(organizationId),
    onSuccess: (_, organizationId) => {
      queryClient.invalidateQueries({
        queryKey: ['membershipRequests', organizationId],
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
      organizationId,
    }: {
      id: string;
      organizationId: string;
    }) => repository.approve(id, organizationId),
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({
        queryKey: ['membershipRequests', organizationId],
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
      organizationId,
      rejectionReason,
    }: {
      id: string;
      organizationId: string;
      rejectionReason: string;
    }) => repository.reject(id, organizationId, rejectionReason),
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({
        queryKey: ['membershipRequests', organizationId],
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
      organizationId,
    }: {
      id: string;
      organizationId: string;
    }) => repository.cancel(id, organizationId),
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({
        queryKey: ['membershipRequests', organizationId],
      });
    },
  });
}
