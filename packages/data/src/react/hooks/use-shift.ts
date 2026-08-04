'use client';
import { type ShiftDetail, ShiftRepository } from '@repo/data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useShift(id?: string) {
  const sdk = useSdk();
  const repository = new ShiftRepository(sdk);

  return useQuery<ShiftDetail>({
    queryKey: ['shift', id],
    queryFn: () => repository.findByIdDetailed(id ?? ''),
    staleTime: 30 * 1000,
    enabled: !!id,
  });
}

export function useSetShiftRequiredForms() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new ShiftRepository(sdk);

  return useMutation({
    mutationFn: ({
      shiftId,
      formIds,
    }: {
      shiftId: string;
      formIds: string[];
    }) => repository.setRequiredForms(shiftId, formIds),
    onSuccess: (_, { shiftId }) => {
      queryClient.invalidateQueries({ queryKey: ['shift', shiftId] });
    },
  });
}
