import { DataError } from '../../errors/data-error';
import type {
  GetMyOrganizationsQuery,
  GetMyPermissionsQuery,
  User,
} from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export class UserRepository extends BaseRepository {
  async getMe(): Promise<User> {
    try {
      const data = await this.sdk.GetMe();
      return data.me;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const data = await this.sdk.GetUser({ id });
      return data.user ?? null;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findByCheckInId(checkInId: string): Promise<User | null> {
    try {
      const data = await this.sdk.GetUserByCheckInId({ checkInId });
      return data.userByCheckInId ?? null;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async getMyPermissions(): Promise<
    NonNullable<GetMyPermissionsQuery['me']['permissions']>
  > {
    try {
      const data = await this.sdk.GetMyPermissions();
      return data.me.permissions ?? [];
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async getMyOrganizations(
    options: { limit?: number; offset?: number } = {},
  ): Promise<GetMyOrganizationsQuery['organizations']> {
    const { limit = 10, offset = 0 } = options;
    try {
      const data = await this.sdk.GetMyOrganizations({ limit, offset });
      return data.organizations;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}
