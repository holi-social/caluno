import type {
  GetMyOrganizationsQuery,
  GetMyPermissionsQuery,
  UpdateMyLocaleMutation,
  User,
} from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export class UserRepository extends BaseRepository {
  async getMe(): Promise<User> {
    const data = await this.sdk.GetMe();
    return data.me;
  }

  async findById(id: string): Promise<User | null> {
    const data = await this.sdk.GetUser({ id });
    return data.user ?? null;
  }

  async findByCheckInId(checkInId: string): Promise<User | null> {
    const data = await this.sdk.GetUserByCheckInId({ checkInId });
    return data.userByCheckInId ?? null;
  }

  async getMyPermissions(): Promise<
    NonNullable<GetMyPermissionsQuery['me']['permissions']>
  > {
    const data = await this.sdk.GetMyPermissions();
    return data.me.permissions ?? [];
  }

  async getMyOrganizations(
    options: { limit?: number; offset?: number } = {},
  ): Promise<GetMyOrganizationsQuery['organizations']> {
    const { limit = 10, offset = 0 } = options;
    const data = await this.sdk.GetMyOrganizations({ limit, offset });
    return data.organizations;
  }

  async updateMyLocale(
    locale: string,
  ): Promise<UpdateMyLocaleMutation['updateMyLocale']> {
    const data = await this.sdk.UpdateMyLocale({ locale });
    return data.updateMyLocale;
  }
}
