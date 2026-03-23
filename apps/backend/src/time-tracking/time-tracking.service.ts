import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { NotFoundGraphQLError } from '../graphql/errors';
import { PaginationInput } from '../graphql/pagination.input';
import { MembershipService } from '../membership/membership.service';
import { AddTimeEntryInput } from './inputs/add-time-entry.input';
import { CloseTimeEntryInput } from './inputs/close-time-enty-input';
import type { TimeEntryEntity } from './schemas/time-entry.schema';

@Injectable()
export class TimeTrackingService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    readonly _membershipService: MembershipService,
  ) {}
  async addTimeEntry(input: AddTimeEntryInput): Promise<TimeEntryEntity> {
    const [timeEntry] = await this.db
      .insert(schema.timeEntries)
      .values(input)
      .returning();
    return timeEntry;
  }

  async closeTimeEntry(
    id: string,
    organizationId: string,
    input: CloseTimeEntryInput,
  ): Promise<TimeEntryEntity> {
    //  TODO: limit by org id
    const [timeEntry] = await this.db
      .update(schema.timeEntries)
      .set(input)
      .where(and(eq(schema.timeEntries.id, id)))
      .returning();

    if (!timeEntry) {
      throw new NotFoundGraphQLError('Time entry not found');
    }

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

  async findAll(
    organizationId: string,
    pagination: PaginationInput,
  ): Promise<{ entries: TimeEntryEntity[]; total: number }> {
    const condition = { shift: { organizationId } };

    const entries = await this.db.query.timeEntries.findMany({
      where: condition,
      orderBy: { startedAt: 'desc' },
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const [{ total }] = await this.db.query.timeEntries.findMany({
      columns: {},
      extras: { total: count() },
      where: condition,
    });

    return { entries, total };
  }

  async findByUser(
    organizationId: string,
    userId: string,
    pagination: PaginationInput,
  ): Promise<{ entries: TimeEntryEntity[]; total: number }> {
    //  TODO: All Entries should also be returned for a user, so they personally
    //  Can see their entries in the system across the organizations
    //  Should also have optionally filters - all orgs (so don't use AuthenticatedGraphQLContext in resolver)
    //  Types of entries - all, closed, open

    const condition = {
      shift: { organizationId },
      volunteerId: userId,
    };

    const entries = await this.db.query.timeEntries.findMany({
      where: condition,
      orderBy: { startedAt: 'desc' },
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const [{ total }] = await this.db.query.timeEntries.findMany({
      columns: {},
      extras: { total: count() },
      where: condition,
    });

    return { entries, total };
  }
}
