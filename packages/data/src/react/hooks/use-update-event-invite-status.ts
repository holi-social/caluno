'use client';

import { EventRepository } from '@repo/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EventInviteStatus } from '../../generated/graphql';
import { useSdk } from './use-graphql-client';

export function useUpdateEventInviteStatus() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new EventRepository(sdk);

  return useMutation({
    mutationFn: (variables: { eventId: string; status: EventInviteStatus }) =>
      repository.updateEventInviteStatus(variables.eventId, variables.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
    },
  });
}
