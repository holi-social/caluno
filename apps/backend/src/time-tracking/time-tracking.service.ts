import { Inject, Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
  ForbiddenGraphQLError,
  NotFoundGraphQLError,
} from '../graphql/errors';
import { PaginationInput } from '../graphql/pagination.input';
import { MembershipService } from '../membership/membership.service';
import { ShiftService } from '../shift/shift.service';
import { AddTimeEntryInput } from './inputs/add-time-entry.input';
import { CloseTimeEntryInput } from './inputs/close-time-enty-input';
import { UpdateTimeEntryInput } from './inputs/update-time-entry.input';
import type {
  TimeEntryEntity,
  TimeEntryEntityWithRelations,
} from './schemas/time-entry.schema';

@Injectable()
export class TimeTrackingService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    readonly _membershipService: MembershipService,
    private readonly shiftService: ShiftService,
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
      instance.master.organizationUnitId !== organizationUnitId
    ) {
      throw new NotFoundGraphQLError(
        'Shift instance does not exist in this organization',
      );
    }

    try {
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
    } catch (error) {
      if (isConstraintViolation(error, UNIQUE_OPEN_ENTRY_CONSTRAINT)) {
        throw new ConflictGraphQLError('Already checked in');
      }
      throw error;
    }
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

    if (!existsInOrgUnit(organizationUnitId, entry)) {
      throw new NotFoundGraphQLError('Time entry not found');
    }

    const [timeEntry] = await this.db
      .update(schema.timeEntries)
      .set({ endedAt: input.endedAt, notes: input.notes })
      .where(eq(schema.timeEntries.id, id))
      .returning();

    return timeEntry;
  }

  async updateTimeEntry(
    id: string,
    organizationUnitId: string,
    input: UpdateTimeEntryInput,
  ): Promise<TimeEntryEntity> {
    const entry = await this.db.query.timeEntries.findFirst({
      where: { id },
      with: { shiftInstance: { with: { master: true } } },
    });

    if (!existsInOrgUnit(organizationUnitId, entry)) {
      throw new NotFoundGraphQLError('Time entry not found');
    }

    const [timeEntry] = await this.db
      .update(schema.timeEntries)
      .set(input)
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

    if (!existsInOrgUnit(organizationUnitId, entry)) {
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

    if (!existsInOrgUnit(organizationUnitId, entry)) {
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

  async findMyTime(
    userId: string,
    pagination: PaginationInput,
  ): Promise<{ entries: TimeEntryEntityWithRelations[]; total: number }> {
    const entries = await this.db.query.timeEntries.findMany({
      where: { volunteerId: userId },
      with: {
        volunteer: true,
        shiftInstance: {
          with: {
            master: {
              with: { organizationUnit: { with: { organization: true } } },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(schema.timeEntries)
      .where(eq(schema.timeEntries.volunteerId, userId));

    return { entries: entries as TimeEntryEntity[], total };
  }

  /**
   * Resolves a shift instance a volunteer may self-track, after verifying it
   * exists (not cancelled) and the user is a member of its org unit.
   */
  private async resolveTrackableInstance(
    shiftInstanceId: string,
    userId: string,
  ): Promise<Awaited<ReturnType<ShiftService['findInstanceWithMaster']>>> {
    const instance =
      await this.shiftService.findInstanceWithMaster(shiftInstanceId);

    if (instance.isCancelled) {
      throw new NotFoundGraphQLError('Shift instance not found');
    }

    const isMember = await this._membershipService.isMemberOfUnitOrAncestor(
      userId,
      instance.master.organizationUnitId,
    );
    if (!isMember) {
      throw new ForbiddenGraphQLError('You are not a member of this unit');
    }

    return instance;
  }

  async checkIn(
    shiftInstanceId: string,
    userId: string,
  ): Promise<TimeEntryEntity> {
    const instance = await this.resolveTrackableInstance(
      shiftInstanceId,
      userId,
    );

    // Self check-in is only valid around the shift time (a supervisor/admin can
    // still add or correct entries anytime via addTimeEntry, which is unbounded).
    const now = Date.now();
    const opensAt =
      instance.actualStartsAt.getTime() - CHECK_IN_OPENS_BEFORE_MS;
    const closesAt = instance.actualEndsAt.getTime() + CHECK_IN_CLOSES_AFTER_MS;
    if (now < opensAt || now > closesAt) {
      throw new BadRequestGraphQLError(
        'Check-in is only available around the shift time',
      );
    }

    const isBooked = await this.shiftService.isVolunteerBooked(
      shiftInstanceId,
      userId,
    );
    if (!isBooked) {
      throw new ForbiddenGraphQLError('You are not signed up for this shift');
    }

    const alreadyCheckedIn = await this.shiftService.hasOpenTimeEntry(
      shiftInstanceId,
      userId,
    );
    if (alreadyCheckedIn) {
      throw new ConflictGraphQLError('Already checked in');
    }

    const input = new AddTimeEntryInput();
    input.shiftInstanceId = shiftInstanceId;
    input.volunteerId = userId;
    input.startedAt = new Date();
    input.endedAt = null;
    input.notes = null;

    return this.addTimeEntry(instance.master.organizationUnitId, input);
  }

  async checkOut(
    shiftInstanceId: string,
    userId: string,
  ): Promise<TimeEntryEntity> {
    const instance = await this.resolveTrackableInstance(
      shiftInstanceId,
      userId,
    );

    const entry = await this.shiftService.findOpenTimeEntry(
      shiftInstanceId,
      userId,
    );
    if (!entry) {
      throw new NotFoundGraphQLError('No open check-in found for this shift');
    }

    const closeInput = new CloseTimeEntryInput();
    closeInput.endedAt = new Date();
    closeInput.notes = null;

    return this.closeTimeEntry(
      entry.id,
      instance.master.organizationUnitId,
      closeInput,
    );
  }
}

// Self check-in window (relative to the shift instance's actual start/end).
const CHECK_IN_OPENS_BEFORE_MS = 3 * 60 * 60 * 1000; // 3h before start
const CHECK_IN_CLOSES_AFTER_MS = 60 * 60 * 1000; // 1h after end

const UNIQUE_OPEN_ENTRY_CONSTRAINT =
  'uq_time_entries_open_per_instance_volunteer';

// Drizzle wraps postgres errors, so the driver error lives on `error.cause`.
// '23505' is the Postgres unique-violation SQLSTATE.
const isConstraintViolation = (
  error: unknown,
  constraintName: string,
): boolean => {
  const driverError =
    error instanceof Error && 'cause' in error && error.cause
      ? error.cause
      : error;

  return (
    !!driverError &&
    typeof driverError === 'object' &&
    'code' in driverError &&
    driverError.code === '23505' &&
    'constraint' in driverError &&
    driverError.constraint === constraintName
  );
};

const existsInOrgUnit = (
  organizationUnitId: string,
  entry?: {
    shiftInstance: { master: { organizationUnitId: string } | null } | null;
  },
): entry is {
  shiftInstance: { master: { organizationUnitId: string } };
} => {
  return !!(
    entry?.shiftInstance?.master?.organizationUnitId === organizationUnitId
  );
};
