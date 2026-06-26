'use client';
import { type ShiftDetail, ShiftRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useShift(id: string) {
  const sdk = useSdk();
  const repository = new ShiftRepository(sdk);

  return useQuery<ShiftDetail>({
    queryKey: ['shift', id],
    queryFn: () => repository.findByIdDetailed(id),
    staleTime: 30 * 1000,
  });
}
