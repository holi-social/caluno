'use client';

import { ShiftRepository } from '@repo/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useCheckOut() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new ShiftRepository(sdk);

  return useMutation({
    mutationFn: (shiftInstanceId: string) =>
      repository.checkOut(shiftInstanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myShiftInstances'] });
      queryClient.invalidateQueries({ queryKey: ['availableShiftInstances'] });
    },
  });
}
