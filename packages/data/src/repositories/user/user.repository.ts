import type { GraphQLClient } from 'graphql-request';
import { DataError } from '../../errors/data-error';
import type { User } from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export class UserRepository extends BaseRepository {
  constructor(client: GraphQLClient) {
    super(client);
  }

  /**
   * Get current authenticated user
   * Callable from server components or wrapped in hooks for client
   */
  async getMe(): Promise<User> {
    try {
      const data = await this.sdk.GetMe();
      return data.me;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  /**
   * Get user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const data = await this.sdk.GetUser({ id });
      return data.user ?? null;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}
