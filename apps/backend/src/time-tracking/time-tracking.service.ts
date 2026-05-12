import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
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
  async addTimeEntry(
    organizationUnitId: string,
    input: AddTimeEntryInput,
  ): Promise<TimeEntryEntity> {
    const instance = await this.db.query.shiftInstances.findFirst({
      where: { id: input.shiftInstanceId },
      with: { master: true },
    });

    if (
      !instance ||
      !instance.master ||
      instance.master.organizationUnitId !== organizationUnitId
    ) {
      throw new NotFoundGraphQLError(
        'Shift instance does not exist in this organisation',
      );
    }

    const [timeEntry] = await this.db
      .insert(schema.timeEntries)
      .values({
        shiftInstanceId: input.shiftInstanceId,
        volunteerId: input.volunteerId,
        startedAt: input.startedAt,
        notes: input.notes,
      })
      .returning();
    return timeEntry;
  }

  async closeTimeEntry(
    id: string,
    organizationUnitId: string,
    input: CloseTimeEntryInput,
  ): Promise<TimeEntryEntity> {
    const entry = await this.db.query.timeEntries.findFirst({
      where: { id },
      with: { shiftInstance: { with: { master: true } } },
    });

    if (
      !entry ||
      !entry.shiftInstance ||
      !entry.shiftInstance.master ||
      entry.shiftInstance.master.organizationUnitId !== organizationUnitId
    ) {
      throw new NotFoundGraphQLError('Time entry not found');
    }

    const [timeEntry] = await this.db
      .update(schema.timeEntries)
      .set({ endedAt: input.endedAt, notes: input.notes })
      .where(eq(schema.timeEntries.id, id))
      .returning();

    return timeEntry;
  }

  async deleteTimeEntry(
    organizationUnitId: string,
    id: string,
  ): Promise<TimeEntryEntity> {
    const entry = await this.db.query.timeEntries.findFirst({
      where: { id },
      with: { shiftInstance: { with: { master: true } } },
    });

    if (
      !entry ||
      !entry.shiftInstance ||
      !entry.shiftInstance.master ||
      entry.shiftInstance.master.organizationUnitId !== organizationUnitId
    ) {
      throw new NotFoundGraphQLError('Time entry not found');
    }

    const [deletedTimeEntry] = await this.db
      .delete(schema.timeEntries)
      .where(eq(schema.timeEntries.id, id))
      .returning();
    return deletedTimeEntry;
  }

  async findById(
    id: string,
    organizationUnitId: string,
  ): Promise<TimeEntryEntity> {
    const entry = await this.db.query.timeEntries.findFirst({
      where: { id },
      with: { shiftInstance: { with: { master: true } }, volunteer: true },
    });

    if (
      !entry ||
      !entry.shiftInstance?.master ||
      entry.shiftInstance.master.organizationUnitId !== organizationUnitId
    ) {
      throw new NotFoundGraphQLError('Time entry not found');
    }

    return entry;
  }

  async findAll(
    organizationUnitId: string,
    pagination: PaginationInput,
  ): Promise<{ entries: TimeEntryEntity[]; total: number }> {
    const timeEntries = await this.db.query.timeEntries.findMany({
      with: { shiftInstance: { with: { master: true } } },
      orderBy: { startedAt: 'desc' },
    });

    const filteredTimeEntries = timeEntries.filter(
      (entry) =>
        entry.shiftInstance?.master?.organizationUnitId === organizationUnitId,
    );

    const paginated = filteredTimeEntries.slice(
      pagination.offset,
      pagination.offset + pagination.limit,
    );

    return {
      entries: paginated as TimeEntryEntity[],
      total: filteredTimeEntries.length,
    };
  }

  async findByUser(
    organizationUnitId: string,
    userId: string,
    pagination: PaginationInput,
  ): Promise<{ entries: TimeEntryEntity[]; total: number }> {
    const allEntries = await this.db.query.timeEntries.findMany({
      where: { volunteerId: userId },
      with: { shiftInstance: { with: { master: true } } },
      orderBy: { startedAt: 'desc' },
    });

    const filtered = allEntries.filter(
      (e) => e.shiftInstance?.master?.organizationUnitId === organizationUnitId,
    );

    const paginated = filtered.slice(
      pagination.offset,
      pagination.offset + pagination.limit,
    );

    return { entries: paginated as TimeEntryEntity[], total: filtered.length };
  }
}
