import { randomBytes } from 'node:crypto';
import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import { numericCalendarDate } from '../../i18n/format-date-time';
import {
  POSTHOG_DISTINCT_SECRET_SLOT,
  posthogDistinctSecrets,
} from './schemas/posthog-distinct-secret.schema';

type CachedSecret = {
  secret: string;
  validForDate: string;
};

@Injectable()
export class PostHogDistinctSecretService implements OnModuleInit {
  private readonly logger = new Logger(PostHogDistinctSecretService.name);
  private cached: CachedSecret | null = null;

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureCurrent();
  }

  async ensureCurrent(): Promise<string | null> {
    const today = numericCalendarDate(new Date());
    if (this.cached?.validForDate === today) {
      return this.cached.secret;
    }

    try {
      const generated = randomBytes(32).toString('hex');
      const [written] = await this.db
        .insert(posthogDistinctSecrets)
        .values({
          slot: POSTHOG_DISTINCT_SECRET_SLOT,
          secret: generated,
          validForDate: today,
        })
        .onConflictDoUpdate({
          target: posthogDistinctSecrets.slot,
          set: {
            secret: generated,
            validForDate: today,
          },
          setWhere: sql`${posthogDistinctSecrets.validForDate} is distinct from excluded.valid_for_date`,
        })
        .returning();

      const row = written ?? (await this.findCurrent());
      if (!row) {
        return null;
      }

      this.cached = {
        secret: row.secret,
        validForDate: row.validForDate,
      };
      return this.cached.secret;
    } catch (error) {
      this.logger.error(
        'Failed to load PostHog distinct secret',
        error instanceof Error ? error.stack : undefined,
      );
      return this.cached?.validForDate === today ? this.cached.secret : null;
    }
  }

  private async findCurrent(): Promise<CachedSecret | undefined> {
    const [row] = await this.db
      .select()
      .from(posthogDistinctSecrets)
      .where(eq(posthogDistinctSecrets.slot, POSTHOG_DISTINCT_SECRET_SLOT));
    if (!row) {
      return undefined;
    }
    return { secret: row.secret, validForDate: row.validForDate };
  }
}
