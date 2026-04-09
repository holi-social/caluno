'use client';
import { type ShiftDetail, ShiftRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useGraphQLClient } from './use-graphql-client';

export function useShift(id: string) {
  const client = useGraphQLClient();
  const repository = new ShiftRepository(client);

  return useQuery<ShiftDetail>({
    queryKey: ['shift', id],
    queryFn: () => repository.findByIdDetailed(id),
    staleTime: 30 * 1000,
  });
}
