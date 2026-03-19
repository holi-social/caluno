import type { GraphQLClient } from 'graphql-request';
import { getSdk } from '../../generated/graphql';

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export abstract class BaseRepository {
  protected readonly sdk: ReturnType<typeof getSdk>;

  constructor(client: GraphQLClient) {
    this.sdk = getSdk(client);
  }
}
