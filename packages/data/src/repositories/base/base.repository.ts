import type { getSdk } from '../../generated/graphql';

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export abstract class BaseRepository {
  protected readonly sdk: ReturnType<typeof getSdk>;

  constructor(sdk: ReturnType<typeof getSdk>) {
    this.sdk = sdk;
  }
}
