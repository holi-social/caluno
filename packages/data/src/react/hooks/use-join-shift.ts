'use client';

import { ShiftRepository } from '@repo/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGraphQLClient } from './use-graphql-client';

export function useJoinShift() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new ShiftRepository(client);

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
