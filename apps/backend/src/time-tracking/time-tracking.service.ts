import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database-connection';
import type { Database } from '../database/database.module';
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
  async addTimeEntry(
    organizationUnitId: string,
    input: AddTimeEntryInput,
  ): Promise<TimeEntryEntity> {
    const shift = await this.db.query.shifts.findFirst({
      where: {
        organizationUnitId,
        id: input.shiftId,
      },
    });

    if (!shift) {
      throw new NotFoundGraphQLError(
        'Shift does not exist in this organisation',
      );
    }

    const [timeEntry] = await this.db
      .insert(schema.timeEntries)
      .values(input)
      .returning();
    return timeEntry;
  }

  async closeTimeEntry(
    id: string,
    organizationUnitId: string,
    input: CloseTimeEntryInput,
  ): Promise<TimeEntryEntity> {
    const [timeEntry] = await this.db
      .update(schema.timeEntries)
      .set(input)
      .from(schema.shifts)
      .where(
        and(
          eq(schema.timeEntries.id, id),
          eq(schema.shifts.id, schema.timeEntries.shiftId),
          eq(schema.shifts.organizationUnitId, organizationUnitId),
        ),
      )
      .returning();

    if (!timeEntry) {
      throw new NotFoundGraphQLError('Time entry not found');
    }

    return timeEntry;
  }

  async deleteTimeEntry(
    organizationUnitId: string,
    id: string,
  ): Promise<TimeEntryEntity> {
    const timeEntry = await this.db.query.timeEntries.findFirst({
      where: {
        shift: { organizationUnitId },
        id,
      },
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
    organizationUnitId: string,
    pagination: PaginationInput,
  ): Promise<{ entries: TimeEntryEntity[]; total: number }> {
    const condition = { shift: { organizationUnitId } };

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
    organizationUnitId: string,
    userId: string,
    pagination: PaginationInput,
  ): Promise<{ entries: TimeEntryEntity[]; total: number }> {
    //  TODO: All Entries should also be returned for a user, so they personally
    //  Can see their entries in the system across the organizations
    //  Should also have optionally filters - all orgs (so don't use AuthenticatedGraphQLContext in resolver)
    //  Types of entries - all, closed, open

    const condition = {
      shift: { organizationUnitId },
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
