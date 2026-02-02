import { GraphQLClient } from 'graphql-request';

export interface GraphQLClientConfig {
  url: string;
  credentials?: RequestCredentials;
  headers?: Record<string, string> | (() => Record<string, string>);
}

export function createGraphQLClient(
  config: GraphQLClientConfig,
): GraphQLClient {
  const client = new GraphQLClient(config.url, {
    credentials: config.credentials,
    headers: typeof config.headers === 'function' ? undefined : config.headers,
  });

  if (typeof config.headers === 'function') {
    const getHeaders = config.headers;
    client.requestConfig.requestMiddleware = (request) => {
      return {
        ...request,
        headers: {
          ...request.headers,
          ...getHeaders(),
        },
      };
    };
  }

  return client;
}
