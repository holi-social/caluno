export interface GraphQLClientConfig {
  url: string;
  credentials?: RequestCredentials;
  headers?: Record<string, string>;
}
