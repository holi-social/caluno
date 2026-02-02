'use client';

import { UserRepository } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useGraphQLClient } from './use-graphql-client';

export function useMe() {
  const client = useGraphQLClient();
  const repository = new UserRepository(client);

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => repository.getMe(),
  });
}

export function useUser(id: string) {
  const client = useGraphQLClient();
  const repository = new UserRepository(client);

  return useQuery({
    queryKey: ['user', id],
    queryFn: () => repository.findById(id),
    enabled: !!id,
  });
}

export function useMyOrganizations(limit = 100, offset = 0) {
  const client = useGraphQLClient();
  const repository = new UserRepository(client);

  return useQuery({
    queryKey: ['user', 'me', 'organizations', { limit, offset }],
    queryFn: () => repository.getMyOrganizations({ limit, offset }),
    staleTime: 5 * 60 * 1000,
  });
}
