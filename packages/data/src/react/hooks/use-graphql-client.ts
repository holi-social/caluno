'use client';
import type { GraphQLClient } from 'graphql-request';
import { createContext, useContext } from 'react';
import { sdkErrorTranslation } from '../../errors/translate';
import { getSdk } from '../../generated/graphql';

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

export function useSdk() {
  const client = useGraphQLClient();
  // Translate failures to DataError so hooks/consumers get the backend message
  // and code, not graphql-request's raw serialized-response ClientError.
  return getSdk(client, sdkErrorTranslation);
}
