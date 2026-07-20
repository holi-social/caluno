import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { UserEntity } from '../auth/schemas/auth.schema';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { NotFoundGraphQLError } from '../graphql/errors';
import { type Locale, resolveRequestLocale } from '../graphql/locale';
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

  async findByEmail(email: string): Promise<UserEntity | undefined> {
    return this.db.query.users.findFirst({
      where: { email },
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
      throw new NotFoundGraphQLError('User not found');
    }

    return user;
  }

  async updateLocale(
    userId: string,
    locale: string,
  ): Promise<UserEntity | undefined> {
    const [user] = await this.db
      .update(schema.users)
      .set({ locale })
      .where(eq(schema.users.id, userId))
      .returning();
    return user;
  }

  async updateImage(
    userId: string,
    imageUrl: string | null,
  ): Promise<UserEntity> {
    const [user] = await this.db
      .update(schema.users)
      .set({ image: imageUrl })
      .where(eq(schema.users.id, userId))
      .returning();

    if (!user) {
      throw new NotFoundGraphQLError('User not found');
    }

    return user;
  }

  async resolveLocale(
    userId: string,
    headers: Record<string, unknown>,
  ): Promise<Locale> {
    const user = await this.db.query.users.findFirst({
      where: { id: userId },
      columns: { locale: true },
    });

    if (user?.locale) {
      return user.locale as Locale;
    }

    const detected = resolveRequestLocale(headers);

    await this.db
      .update(schema.users)
      .set({ locale: detected })
      .where(eq(schema.users.id, userId));

    return detected;
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
