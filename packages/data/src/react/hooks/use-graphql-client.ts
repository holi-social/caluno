'use client';
import type { GraphQLClient } from 'graphql-request';
import { createContext, useContext } from 'react';

const GraphQLClientContext = createContext<GraphQLClient | null>(null);

export const GraphQLClientProvider = GraphQLClientContext.Provider;
export function useGraphQLClient() {
  const client = useContext(GraphQLClientContext);
  if (!client) {
    throw new Error(
      'useGraphQLClient must be used within GraphQLClientProvider',
    );
  }
  return client;
}
