'use client';

import type { UpdateMyImageInput } from '@repo/data';
import { UserRepository } from '@repo/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useUpdateMyImage() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new UserRepository(sdk);

  return useMutation({
    mutationFn: (input: UpdateMyImageInput) => repository.updateMyImage(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}
