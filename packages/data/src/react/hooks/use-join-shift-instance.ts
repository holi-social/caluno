'use client';

import { ShiftRepository } from '@repo/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useJoinShiftInstance() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new ShiftRepository(sdk);

  return useMutation({
    mutationFn: (instanceId: string) => repository.joinInstance(instanceId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['shift', result.shift.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['activeShifts'],
      });
    },
  });
}
