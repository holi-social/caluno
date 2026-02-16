'use client';

import {
  type ApproveVolunteerSessionInput,
  type RejectVolunteerSessionInput,
  VolunteerSessionRepository,
  type VolunteerSessionStatus,
} from '@repo/data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useGraphQLClient } from './use-graphql-client';

export function useVolunteerSessions(
  organizationId: string,
  options: { status?: VolunteerSessionStatus } = {},
) {
  const client = useGraphQLClient();
  const repository = new VolunteerSessionRepository(client);

  return useQuery({
    queryKey: ['volunteer-sessions', organizationId, options.status],
    queryFn: () => repository.findAllByOrganizationId(organizationId, options),
    enabled: !!organizationId,
  });
}

export function useApproveVolunteerSession() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new VolunteerSessionRepository(client);

  return useMutation({
    mutationFn: (input: ApproveVolunteerSessionInput) =>
      repository.approve(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['shift'] });
    },
  });
}

export function useRejectVolunteerSession() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new VolunteerSessionRepository(client);

  return useMutation({
    mutationFn: (input: RejectVolunteerSessionInput) =>
      repository.reject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['shift'] });
    },
  });
}
