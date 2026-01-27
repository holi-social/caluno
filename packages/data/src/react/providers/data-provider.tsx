'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { createGraphQLClient } from '../../client/graphql-client';
import { GraphQLClientProvider } from '../hooks/use-graphql-client';

export interface DataProviderProps {
  children: ReactNode;
  apiUrl: string;
  queryClient?: QueryClient;
  showDevTools?: boolean;
}

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

export function DataProvider({
  children,
  apiUrl,
  queryClient: customQueryClient,
  showDevTools = process.env.NODE_ENV === 'development',
}: DataProviderProps) {
  const queryClient = customQueryClient ?? defaultQueryClient;
  const graphqlClient = useMemo(() => {
    return createGraphQLClient({
      url: apiUrl,
      credentials: 'include', // keep this for session cookies
    });
  }, [apiUrl]);

  return (
    <QueryClientProvider client={queryClient}>
      <GraphQLClientProvider value={graphqlClient}>
        {children}
        {showDevTools && <ReactQueryDevtools />}
      </GraphQLClientProvider>
    </QueryClientProvider>
  );
}
