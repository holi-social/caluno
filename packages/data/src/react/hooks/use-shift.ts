'use client';
import {
  type ShiftDetail,
  type ShiftInstanceDetail,
  ShiftRepository,
} from '@repo/data';
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

export function useShiftInstance(id?: string) {
  const sdk = useSdk();
  const repository = new ShiftRepository(sdk);

  return useQuery<ShiftInstanceDetail>({
    queryKey: ['shift-instance', id],
    queryFn: () => repository.findInstance(id ?? ''),
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

export function useSetShiftInstanceRequiredForms() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new ShiftRepository(sdk);

  return useMutation({
    mutationFn: ({
      instanceId,
      formIds,
    }: {
      instanceId: string;
      formIds: string[];
    }) => repository.setInstanceRequiredForms(instanceId, formIds),
    onSuccess: (_, { instanceId }) => {
      queryClient.invalidateQueries({
        queryKey: ['shift-instance', instanceId],
      });
    },
  });
}
