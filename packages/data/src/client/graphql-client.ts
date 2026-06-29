import { GraphQLClient } from 'graphql-request';
import { LOCALE_HEADER, type Locale } from '../constants';

export interface GraphQLClientConfig {
  url: string;
  credentials?: RequestCredentials;
  headers?: Record<string, string> | (() => Record<string, string>);
  locale?: Locale;
}

export function createGraphQLClient(
  config: GraphQLClientConfig,
): GraphQLClient {
  const localeHeaders = config.locale
    ? { [LOCALE_HEADER]: config.locale }
    : undefined;

  const client = new GraphQLClient(config.url, {
    credentials: config.credentials,
    headers: {
      'content-type': 'application/json',
      ...(typeof config.headers === 'function' ? undefined : config.headers),
      ...localeHeaders,
    },
  });

  if (typeof config.headers === 'function') {
    const getHeaders = config.headers;
    client.requestConfig.requestMiddleware = (request) => {
      return {
        ...request,
        headers: {
          'content-type': 'application/json',
          ...request.headers,
          ...getHeaders(),
          ...localeHeaders,
        },
      };
    };
  }

  return client;
}
