import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import { PERMISSIONS } from '../auth/constants';
import type { UserEntity } from '../auth/schemas/auth.schema';
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
import { NotificationService } from '../notification';
import { OrganizationService } from '../organization/organization.service';
import { isParticipatingShiftInviteStatus } from '../shared/invite-status';
import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../shared/observability/posthog.events';
import { PostHogService } from '../shared/observability/posthog.service';
import { ShiftInviteStatus } from '../shift/enums';
import { ShiftService } from '../shift/shift.service';
import { UserService } from '../user/user.service';
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
    private readonly postHogService: PostHogService,
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}
  async addTimeEntry(
    organizationUnitId: string,
    input: AddTimeEntryInput,
    _actorUserId: string,
    options?: { skipCapture?: boolean },
  ): Promise<TimeEntryEntity> {
    let reimbursementTypeId: string | null = null;
    if (input.shiftInstanceId) {
      const context = await this.resolveShiftInstanceContext(
        input.shiftInstanceId,
        organizationUnitId,
      );

      // Fail fast instead of relying on the DB unique-index guard below.
      // Closed (historical) entries coexist with an open entry, so only
      // check when the new entry would itself be open.
      if (!input.endedAt) {
        const alreadyCheckedIn = await this.shiftService.hasOpenTimeEntry(
          input.shiftInstanceId,
          input.volunteerId,
        );
        if (alreadyCheckedIn) {
          throw new ConflictGraphQLError('Already checked in');
        }
      }

      reimbursementTypeId = context.reimbursementTypeId;
    }

    try {
      const [timeEntry] = await this.db
        .insert(schema.timeEntries)
        .values({
          shiftInstanceId: input.shiftInstanceId ?? null,
          organizationUnitId,
          volunteerId: input.volunteerId,
          startedAt: input.startedAt,
          endedAt: input.endedAt ?? null,
          notes: input.notes,
          reimbursementTypeId,
        })
        .returning();
      if (!options?.skipCapture) {
        this.postHogService.capture({
          event: POSTHOG_EVENT.TIME_ENTRY_CREATE,
          userId: timeEntry.volunteerId,
          properties: {
            surface: POSTHOG_SURFACE.BACKOFFICE,
            organization_unit_id: organizationUnitId,
            shift_instance_id: timeEntry.shiftInstanceId ?? undefined,
          },
        });
      }
      return timeEntry;
    } catch (error) {
      if (
        isConstraintViolation(error, UNIQUE_OPEN_ENTRY_CONSTRAINT) ||
        isConstraintViolation(error, UNIQUE_OPEN_SHIFTLESS_ENTRY_CONSTRAINT)
      ) {
        throw new ConflictGraphQLError('Already checked in');
      }
      throw error;
    }
  }

  private async resolveShiftInstanceContext(
    shiftInstanceId: string,
    organizationUnitId: string,
  ): Promise<{ reimbursementTypeId: string | null }> {
    const instance = await this.db.query.shiftInstances.findFirst({
      where: { id: shiftInstanceId },
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

    return {
      reimbursementTypeId:
        instance.overrideReimbursementTypeId ??
        instance.master.reimbursementTypeId ??
        null,
    };
  }

  async closeTimeEntry(
    id: string,
    organizationUnitId: string,
    input: CloseTimeEntryInput,
    _actorUserId: string,
    options?: { skipCapture?: boolean },
  ): Promise<TimeEntryEntity> {
    const entry = await this.db.query.timeEntries.findFirst({
      where: { id },
    });

    if (!entry || entry.organizationUnitId !== organizationUnitId) {
      throw new NotFoundGraphQLError('Time entry not found');
    }

    const [timeEntry] = await this.db
      .update(schema.timeEntries)
      .set({ endedAt: input.endedAt, notes: input.notes })
      .where(eq(schema.timeEntries.id, id))
      .returning();

    if (!options?.skipCapture) {
      this.postHogService.capture({
        event: POSTHOG_EVENT.TIME_ENTRY_END,
        userId: timeEntry.volunteerId,
        properties: {
          surface: POSTHOG_SURFACE.BACKOFFICE,
          organization_unit_id: organizationUnitId,
          shift_instance_id: timeEntry.shiftInstanceId ?? undefined,
        },
      });
    }

    return timeEntry;
  }

  async updateTimeEntry(
    id: string,
    organizationUnitId: string,
    input: UpdateTimeEntryInput,
    _actorUserId: string,
  ): Promise<TimeEntryEntity> {
    const entry = await this.db.query.timeEntries.findFirst({
      where: { id },
    });

    if (!entry || entry.organizationUnitId !== organizationUnitId) {
      throw new NotFoundGraphQLError('Time entry not found');
    }

    if (input.shiftInstanceId) {
      await this.resolveShiftInstanceContext(
        input.shiftInstanceId,
        organizationUnitId,
      );
    }

    try {
      const [timeEntry] = await this.db
        .update(schema.timeEntries)
        .set(input)
        .where(eq(schema.timeEntries.id, id))
        .returning();

      this.postHogService.capture({
        event: POSTHOG_EVENT.TIME_ENTRY_UPDATE,
        userId: timeEntry.volunteerId,
        properties: {
          surface: POSTHOG_SURFACE.BACKOFFICE,
          organization_unit_id: organizationUnitId,
          shift_instance_id: timeEntry.shiftInstanceId ?? undefined,
        },
      });

      return timeEntry;
    } catch (error) {
      if (
        isConstraintViolation(error, UNIQUE_OPEN_ENTRY_CONSTRAINT) ||
        isConstraintViolation(error, UNIQUE_OPEN_SHIFTLESS_ENTRY_CONSTRAINT)
      ) {
        throw new ConflictGraphQLError('Already checked in');
      }
      throw error;
    }
  }

  async deleteTimeEntry(
    organizationUnitId: string,
    id: string,
    _actorUserId: string,
  ): Promise<TimeEntryEntity> {
    const entry = await this.db.query.timeEntries.findFirst({
      where: { id },
    });

    if (!entry || entry.organizationUnitId !== organizationUnitId) {
      throw new NotFoundGraphQLError('Time entry not found');
    }

    const [deletedTimeEntry] = await this.db
      .delete(schema.timeEntries)
      .where(eq(schema.timeEntries.id, id))
      .returning();

    this.postHogService.capture({
      event: POSTHOG_EVENT.TIME_ENTRY_DELETE,
      userId: deletedTimeEntry.volunteerId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_unit_id: organizationUnitId,
        shift_instance_id: deletedTimeEntry.shiftInstanceId ?? undefined,
      },
    });

    return deletedTimeEntry;
  }

  async findById(
    id: string,
    organizationUnitId: string,
  ): Promise<TimeEntryEntity> {
    const entry = await this.db.query.timeEntries.findFirst({
      where: { id },
    });

    if (!entry || entry.organizationUnitId !== organizationUnitId) {
      throw new NotFoundGraphQLError('Time entry not found');
    }

    return entry;
  }

  async findAll(
    organizationUnitId: string,
    pagination: PaginationInput,
  ): Promise<{ entries: TimeEntryEntity[]; total: number }> {
    const entries = await this.db.query.timeEntries.findMany({
      where: { organizationUnitId },
      orderBy: { startedAt: 'desc' },
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(schema.timeEntries)
      .where(eq(schema.timeEntries.organizationUnitId, organizationUnitId));

    return { entries: entries as TimeEntryEntity[], total };
  }

  async findByUser(
    organizationUnitId: string,
    userId: string,
    pagination: PaginationInput,
  ): Promise<{ entries: TimeEntryEntity[]; total: number }> {
    const entries = await this.db.query.timeEntries.findMany({
      where: { organizationUnitId, volunteerId: userId },
      orderBy: { startedAt: 'desc' },
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(schema.timeEntries)
      .where(
        and(
          eq(schema.timeEntries.organizationUnitId, organizationUnitId),
          eq(schema.timeEntries.volunteerId, userId),
        ),
      );

    return { entries: entries as TimeEntryEntity[], total };
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
   * Cross-org-unit check-in context for the volunteering-side decide page.
   * Intentionally not scoped by ctx.organizationUnitId: eligibility is the
   * intersection of the caller's check-in:manage units and the volunteer's
   * memberships, enforced here (mirrors the ungated checkIn/checkOut mutations).
   */
  async getCheckInContext(
    callerUserId: string,
    checkInId: string,
  ): Promise<{
    volunteer: UserEntity;
    eligibleOrganizationUnits: schema.OrganizationUnitEntity[];
    openTimeEntries: TimeEntryEntityWithRelations[];
  } | null> {
    const volunteer = await this.userService.findByCheckInId(checkInId);
    if (!volunteer) {
      return null;
    }

    const manageableUnits =
      await this.organizationService.findUnitsWithPermission(
        callerUserId,
        PERMISSIONS.CHECK_IN_MANAGE,
      );

    const eligibleUnits: schema.OrganizationUnitEntity[] = [];
    for (const unit of manageableUnits) {
      const isMember = await this._membershipService.isMemberOfUnitOrAncestor(
        volunteer.id,
        unit.id,
      );
      if (isMember) {
        eligibleUnits.push(unit);
      }
    }
    eligibleUnits.sort((a, b) => a.name.localeCompare(b.name));

    const openTimeEntries =
      eligibleUnits.length === 0
        ? []
        : await this.db.query.timeEntries.findMany({
            where: {
              volunteerId: volunteer.id,
              organizationUnitId: { in: eligibleUnits.map((unit) => unit.id) },
              endedAt: { isNull: true },
            },
            // Eager-load shiftInstance: the TimeEntry.shiftInstance field
            // resolver falls back to ShiftService.findInstanceById, which is
            // scoped to ctx.organizationUnitId — unavailable/wrong for this
            // cross-unit (and often headerless) query.
            with: { shiftInstance: true },
            orderBy: { startedAt: 'asc' },
          });

    return {
      volunteer,
      eligibleOrganizationUnits: eligibleUnits,
      openTimeEntries,
    };
  }

  /**
   * Emails a public join link — creates no membership and no request itself
   * (spec decision 5). The recipient's own join is what later unblocks
   * check-in, via `checkInReadiness`'s `pendingMembership` state.
   */
  async inviteVolunteerToOrganization(
    organizationUnitId: string,
    volunteerId: string,
  ): Promise<void> {
    const organizationUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
      columns: { id: true, name: true },
    });
    if (!organizationUnit) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    this.notificationService.notifyOrganizationUnitInvited({
      organizationUnitId,
      organizationUnitName: organizationUnit.name,
      userId: volunteerId,
    });
  }

  /**
   * The four facts the check-in readiness gate needs: unit membership
   * (ancestor-inclusive, matching `getCheckInContext`'s eligibility check),
   * an open membership request against the exact unit, the volunteer's
   * invite status on the specific shift instance, and whether the volunteer
   * already has an open time entry for that instance.
   */
  async getCheckInReadiness(
    volunteerId: string,
    shiftInstanceId: string,
    organizationUnitId: string,
  ): Promise<{
    isMember: boolean;
    openMembershipRequestId: string | null;
    shiftInviteStatus: ShiftInviteStatus | null;
    isParticipating: boolean;
    hasOpenTimeEntry: boolean;
  }> {
    const [isMember, pendingRequest, inviteStatuses, hasOpenTimeEntry] =
      await Promise.all([
        this._membershipService.isMemberOfUnitOrAncestor(
          volunteerId,
          organizationUnitId,
        ),
        this._membershipService.findPendingMembershipRequest(
          volunteerId,
          organizationUnitId,
        ),
        this.shiftService.findInviteStatusesForUser(volunteerId, [
          shiftInstanceId,
        ]),
        this.shiftService.hasOpenTimeEntry(shiftInstanceId, volunteerId),
      ]);

    const shiftInviteStatus = inviteStatuses[0]?.status ?? null;

    return {
      isMember,
      openMembershipRequestId: pendingRequest?.id ?? null,
      shiftInviteStatus,
      isParticipating: isParticipatingShiftInviteStatus(
        shiftInviteStatus ?? undefined,
      ),
      hasOpenTimeEntry,
    };
  }

  /**
   * Manager-initiated check-in (manual check-in flow). The only server-side
   * readiness gate is membership (ancestor-inclusive): a time entry for a
   * non-member corrupts org-scoped timesheet/accounting data. Shift-invite
   * participation stays UI-only guidance so managers can still check in
   * walk-in members.
   */
  async checkInVolunteer(
    organizationUnitId: string,
    volunteerId: string,
    shiftInstanceId: string | null,
    actorUserId: string,
  ): Promise<TimeEntryEntity> {
    const isMember = await this._membershipService.isMemberOfUnitOrAncestor(
      volunteerId,
      organizationUnitId,
    );
    if (!isMember) {
      throw new ForbiddenGraphQLError('Volunteer is not a member of this unit');
    }

    const input = new AddTimeEntryInput();
    input.volunteerId = volunteerId;
    input.shiftInstanceId = shiftInstanceId;
    input.startedAt = new Date();
    input.endedAt = null;
    input.notes = null;

    return this.addTimeEntry(organizationUnitId, input, actorUserId);
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

    const timeEntry = await this.addTimeEntry(
      instance.master.organizationUnitId,
      input,
      userId,
      { skipCapture: true },
    );

    this.postHogService.capture({
      event: POSTHOG_EVENT.SHIFT_INSTANCE_CHECK_IN,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_unit_id: instance.master.organizationUnitId,
        shift_instance_id: shiftInstanceId,
      },
    });

    return timeEntry;
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

    const timeEntry = await this.closeTimeEntry(
      entry.id,
      instance.master.organizationUnitId,
      closeInput,
      userId,
      { skipCapture: true },
    );

    this.postHogService.capture({
      event: POSTHOG_EVENT.SHIFT_INSTANCE_CHECK_OUT,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_unit_id: instance.master.organizationUnitId,
        shift_instance_id: shiftInstanceId,
      },
    });

    return timeEntry;
  }
}

// Self check-in window (relative to the shift instance's actual start/end).
const CHECK_IN_OPENS_BEFORE_MS = 3 * 60 * 60 * 1000; // 3h before start
const CHECK_IN_CLOSES_AFTER_MS = 60 * 60 * 1000; // 1h after end

const UNIQUE_OPEN_ENTRY_CONSTRAINT =
  'uq_time_entries_open_per_instance_volunteer';

const UNIQUE_OPEN_SHIFTLESS_ENTRY_CONSTRAINT =
  'uq_time_entries_open_shiftless_per_org_volunteer';

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
