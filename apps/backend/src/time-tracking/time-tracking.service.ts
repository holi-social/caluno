import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { NotFoundGraphQLError } from '../graphql/errors';
import { MembershipService } from '../membership/membership.service';
import { AddTimeEntryInput } from './inputs/add-time-entry.input';
import type { TimeEntryEntity } from './schemas/time-entry.schema';

@Injectable()
export class TimeTrackingService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    readonly _membershipService: MembershipService,
  ) {}
  async addTimeEntry(
    userId: string,
    input: AddTimeEntryInput,
  ): Promise<TimeEntryEntity> {
    const [timeEntry] = await this.db
      .insert(schema.timeEntries)
      .values(input)
      .returning();
    return timeEntry;
  }

  async deleteTimeEntry(userId: string, id: string): Promise<TimeEntryEntity> {
    const timeEntry = await this.db.query.timeEntries.findFirst({
      where: { id },
    });

    if (!timeEntry) {
      throw new NotFoundGraphQLError('Time entry not found');
    }

    const [deletedTimeEntry] = await this.db
      .delete(schema.timeEntries)
      .where(eq(schema.timeEntries.id, id))
      .returning();
    return deletedTimeEntry;
  }

  async findEntries(organizationId: string): Promise<TimeEntryEntity[]> {
    const entries = await this.db.query.timeEntries.findMany({});

    return entries;
  }
}
