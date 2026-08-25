'use client';

import { ShiftRepository } from '@repo/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ShiftInviteStatus } from '../../generated/graphql';
import { useSdk } from './use-graphql-client';

export function useUpdateShiftInstanceInviteStatus() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new ShiftRepository(sdk);

  return useMutation({
    mutationFn: (variables: {
      instanceId: string;
      status: ShiftInviteStatus;
    }) =>
      repository.updateShiftInstanceInviteStatus(
        variables.instanceId,
        variables.status,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myShiftInstances'] });
    },
  });
}
