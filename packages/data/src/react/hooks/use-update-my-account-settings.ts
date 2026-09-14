'use client';

import { type UpdateMyAccountSettingsInput, UserRepository } from '@repo/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useUpdateMyAccountSettings() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new UserRepository(sdk);

  return useMutation({
    mutationFn: (input: UpdateMyAccountSettingsInput) =>
      repository.updateMyAccountSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}
