'use client';

import { type AddTimeEntryInput, TimeEntryRepository } from '@repo/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGraphQLClient } from './use-graphql-client';

export function useAddTimeEntry() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new TimeEntryRepository(client);

  return useMutation({
    mutationFn: (input: AddTimeEntryInput) => repository.add(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-session'] });
    },
  });
}

export function useDeleteTimeEntry() {
  const client = useGraphQLClient();
  const queryClient = useQueryClient();
  const repository = new TimeEntryRepository(client);

  return useMutation({
    mutationFn: (id: string) => repository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-session'] });
    },
  });
}
