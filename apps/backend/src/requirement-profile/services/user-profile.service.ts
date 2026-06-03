import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import type { UserProfileEntity } from '../schemas/user-profile.schema';

@Injectable()
export class UserProfileService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async findByUserId(userId: string): Promise<UserProfileEntity | undefined> {
    return this.db.query.userProfiles.findFirst({
      where: { userId },
    });
  }

  async getData(userId: string): Promise<Record<string, unknown>> {
    const profile = await this.findByUserId(userId);
    return (profile?.data as Record<string, unknown>) ?? {};
  }

  async upsertData(
    userId: string,
    data: Record<string, unknown>,
    tx?: Database,
  ): Promise<UserProfileEntity> {
    const db = tx ?? this.db;
    const existing = await db.query.userProfiles.findFirst({
      where: { userId },
    });

    if (existing) {
      const merged = { ...(existing.data as Record<string, unknown>), ...data };
      const [updated] = await db
        .update(schema.userProfiles)
        .set({ data: merged })
        .where(eq(schema.userProfiles.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(schema.userProfiles)
      .values({ userId, data })
      .returning();

    return created;
  }
}
