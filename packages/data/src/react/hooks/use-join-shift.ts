'use client';

import { ShiftRepository } from '@repo/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useJoinShift() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new ShiftRepository(sdk);

  return useMutation({
    mutationFn: (shiftId: string) => repository.join(shiftId),
    onSuccess: (_, shiftId) => {
      queryClient.invalidateQueries({
        queryKey: ['shift', shiftId],
      });
      queryClient.invalidateQueries({
        queryKey: ['activeShifts'],
      });
    },
  });
}
