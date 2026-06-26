import { Inject, Injectable } from '@nestjs/common';
import type { UserEntity } from '../auth/schemas/auth.schema';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import type { OrganizationUserProfileEntity } from '../requirement-profile/schemas/organization-user-profile.schema';

@Injectable()
export class UserService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async findById(id: string): Promise<UserEntity | undefined> {
    return this.db.query.users.findFirst({
      where: { id },
    });
  }

  async findByCheckInId(checkInId: string): Promise<UserEntity | undefined> {
    return this.db.query.users.findFirst({
      where: { checkInId },
    });
  }

  async findByIdOrThrow(id: string): Promise<UserEntity> {
    const user = await this.db.query.users.findFirst({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async findOrganizationUserProfile(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationUserProfileEntity> {
    const organizationUserProfile =
      await this.db.query.organizationUserProfiles.findFirst({
        where: { userId, organizationId },
      });
    if (organizationUserProfile) {
      return organizationUserProfile;
    }

    const [newOrganizationUserProfile] = await this.db
      .insert(schema.organizationUserProfiles)
      .values({ userId, organizationId })
      .returning();

    return newOrganizationUserProfile;
  }
}
