import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../../shared/observability/posthog.events';
import { PostHogService } from '../../shared/observability/posthog.service';
import type { UserProfileEntity } from '../schemas/user-profile.schema';

@Injectable()
export class UserProfileService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly postHogService: PostHogService,
  ) {}

  async findByUserId(userId: string): Promise<UserProfileEntity | undefined> {
    return this.db.query.userProfiles.findFirst({
      where: { userId },
    });
  }

  async findByUserIdInOrgUnit(
    userId: string,
    orgUnitId: string,
  ): Promise<UserProfileEntity | undefined> {
    const isMember = await this.db.query.memberships.findFirst({
      where: { userId, organizationUnitId: orgUnitId },
      columns: { id: true },
    });
    const hasRequest = isMember
      ? null
      : await this.db.query.membershipRequests.findFirst({
          where: { userId, organizationUnitId: orgUnitId },
          columns: { id: true },
        });

    if (!isMember && !hasRequest) {
      return undefined;
    }
    return this.findByUserId(userId);
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
      this.captureProfileUpdate(userId, tx);
      return updated;
    }

    const [created] = await db
      .insert(schema.userProfiles)
      .values({ userId, data })
      .returning();

    this.captureProfileUpdate(userId, tx);
    return created;
  }

  private captureProfileUpdate(userId: string, tx?: Database): void {
    if (tx) {
      return;
    }
    this.postHogService.capture({
      event: POSTHOG_EVENT.USER_PROFILE_UPDATE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
      },
    });
  }
}
