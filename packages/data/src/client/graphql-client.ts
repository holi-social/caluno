import { GraphQLClient } from 'graphql-request';

export interface GraphQLClientConfig {
  url: string;
  credentials?: RequestCredentials;
  headers?: Record<string, string>;
}

export function createGraphQLClient(
  config: GraphQLClientConfig,
): GraphQLClient {
  return new GraphQLClient(config.url, {
    credentials: config.credentials,
    headers: config.headers,
  });
}
