import type { GraphQLClient } from 'graphql-request';
import { getSdk } from '../../generated/graphql';

/**
 * Base repository class
 * Provides SDK instance to all repositories
 */
export abstract class BaseRepository {
  protected readonly sdk: ReturnType<typeof getSdk>;

  constructor(client: GraphQLClient) {
    this.sdk = getSdk(client);
  }
}
