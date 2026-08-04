import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, count, eq, gte, inArray, isNull, ne, sql } from 'drizzle-orm';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/constants';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { ShiftInstanceInviteEntity, UserEntity } from '../database/schema';

import { InferResultType } from '../database/typeutil';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
  ForbiddenGraphQLError,
  NotFoundGraphQLError,
} from '../graphql/errors';
import type { PaginationInput } from '../graphql/pagination.input';
import { MembershipService } from '../membership/membership.service';
import type { MembershipRequestEntity } from '../membership/schemas/membership-request.schema';
import { NotificationService } from '../notification/notification.service';
import { buildShiftInviteSchedule } from '../notification/shift-invite-schedule';
import { OrganizationService } from '../organization/organization.service';
import { RequiredFormTargetType } from '../requirement-profile/enums';
import type { RequirementProfileEntity } from '../requirement-profile/schemas/requirement-profile.schema';
import {
  RequiredFormService,
  type RequiredFormStatus,
} from '../requirement-profile/services/required-form.service';
import { JoinStatus } from '../shared/enums/join-status.enum';
import {
  ACTIVE_SHIFT_INVITE_STATUSES,
  canTransitionInviteStatus,
  isParticipatingShiftInviteStatus,
  PARTICIPATING_SHIFT_INVITE_STATUSES,
} from '../shared/invite-status';
import { FilePurpose } from '../storage/enums';
import { FileService } from '../storage/services/file.service';
import { UserService } from '../user/user.service';
import { slugify } from '../utils/slug.util';
import { ShiftInviteStatus, ShiftVisibility, SortOrder } from './enums';
import { CreateShiftInput } from './inputs/create-shift.input';
import { UpdateShiftInput } from './inputs/update-shift.input';
import { UpdateShiftInstanceInput } from './inputs/update-shift-instance.input';
import type { ShiftEntity } from './schemas/shift.schema';
import type { ShiftInstanceEntity } from './schemas/shift-instance.schema';
import type { ShiftInviteEntity } from './schemas/shift-invite.schema';
import { propagateShiftInviteStatusToFutureInstances } from './shift-invite-propagation';
import { startOfTodayInAppTimeZone } from './utils/app-time';
import { getDurationMinutes } from './utils/duration';
import { expandShift } from './utils/rrule-expander';
import { syncShiftInstances } from './utils/shift-instance-sync';

export { getDurationMinutes } from './utils/duration';

type InviteMemberInput = { userId: string; status: ShiftInviteStatus };

const EMPTY_SHIFT_INSTANCE_PAGE: {
  instances: ShiftInstanceEntity[];
  total: number;
} = { instances: [], total: 0 };

@Injectable()
export class ShiftService {
  private readonly logger = new Logger(ShiftService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly membershipService: MembershipService,
    private readonly notificationService: NotificationService,
    private readonly organizationService: OrganizationService,
    private readonly fileService: FileService,
    private readonly requiredFormService: RequiredFormService,
  ) {}

  async findById(id: string): Promise<ShiftEntity> {
    const shift = await this.db.query.shifts.findFirst({
      where: { id, isDeleted: false },
    });

    if (!shift) {
      throw new NotFoundGraphQLError(`Shift with ID ${id} not found`);
    }

    return shift;
  }

  /** Batch load shifts by id (DataLoader). */
  async findByIds(ids: string[]): Promise<ShiftEntity[]> {
    if (ids.length === 0) return [];

    return this.db.query.shifts.findMany({
      where: { id: { in: ids }, isDeleted: false },
    });
  }

  async findOrgUnitsShift(
    id: string,
    organizationUnitId: string,
  ): Promise<ShiftEntity> {
    const shift = await this.db.query.shifts.findFirst({
      where: { id, organizationUnitId, isDeleted: false },
    });

    if (!shift) {
      throw new NotFoundGraphQLError(`Shift with ID ${id} not found`);
    }
    return shift;
  }

  async findInstanceById(
    id: string,
    organizationUnitId: string,
  ): Promise<ShiftInstanceEntity> {
    const instance = await this.db.query.shiftInstances.findFirst({
      where: { id },
      with: { master: true },
    });

    if (!instance) {
      throw new NotFoundGraphQLError(`Shift instance with ID ${id} not found`);
    }

    if (instance.master.organizationUnitId !== organizationUnitId) {
      throw new NotFoundGraphQLError(`Shift instance with ID ${id} not found`);
    }

    return instance;
  }

  /** Participating-invite counts for many instances in one query (DataLoader batch). */
  async getFilledCounts(instanceIds: string[]): Promise<Map<string, number>> {
    if (instanceIds.length === 0) return new Map();

    const rows = await this.db
      .select({
        instanceId: schema.shiftInstanceInvites.instanceId,
        total: count(),
      })
      .from(schema.shiftInstanceInvites)
      .where(
        and(
          inArray(schema.shiftInstanceInvites.instanceId, instanceIds),
          inArray(schema.shiftInstanceInvites.status, [
            ...PARTICIPATING_SHIFT_INVITE_STATUSES,
          ]),
        ),
      )
      .groupBy(schema.shiftInstanceInvites.instanceId);

    return new Map(rows.map((row) => [row.instanceId, Number(row.total)]));
  }

  /** Instances of the given shifts in the org unit, keyed by masterId, ordered by start time. */
  async findInstancesByMasterIds(
    shiftIds: string[],
    organizationUnitId: string,
  ): Promise<Map<string, ShiftInstanceEntity[]>> {
    if (shiftIds.length === 0) return new Map();

    const instances = await this.db.query.shiftInstances.findMany({
      where: {
        masterId: { in: shiftIds },
        master: { organizationUnitId, isDeleted: false },
      },
      orderBy: { actualStartsAt: 'asc' },
    });

    const byMasterId = new Map<string, ShiftInstanceEntity[]>();
    for (const instance of instances) {
      const existing = byMasterId.get(instance.masterId) ?? [];
      byMasterId.set(instance.masterId, [...existing, instance]);
    }

    return byMasterId;
  }

  /** Public (non-cancelled) upcoming instances for a single shift. */
  async findPublicInstancesByShiftId(
    shiftId: string,
  ): Promise<ShiftInstanceEntity[]> {
    return this.findPublicInstancesByShiftIds([shiftId]);
  }

  /** Public (non-cancelled) upcoming instances for many shifts in one query (DataLoader batch). */
  async findPublicInstancesByShiftIds(
    shiftIds: string[],
  ): Promise<ShiftInstanceEntity[]> {
    if (shiftIds.length === 0) return [];
    return this.db.query.shiftInstances.findMany({
      where: {
        masterId: { in: shiftIds },
        isCancelled: false,
        actualStartsAt: { gte: startOfTodayInAppTimeZone() },
      },
      with: { master: true },
      orderBy: { actualStartsAt: 'asc' },
    });
  }

  /** Public (non-deleted) shifts for an org unit that aren't tied to an event. */
  async findIndividualShiftsByOrgUnit(
    organizationUnitId: string,
  ): Promise<ShiftEntity[]> {
    return this.db.query.shifts.findMany({
      where: {
        organizationUnitId,
        eventId: { isNull: true },
        isDeleted: false,
      },
      orderBy: { originalStartsAt: 'asc' },
    });
  }

  /** A user's open time entries across many instances in one query (DataLoader batch). */
  async findOpenTimeEntriesForUser(
    userId: string,
    instanceIds: string[],
  ): Promise<{ shiftInstanceId: string }[]> {
    if (instanceIds.length === 0) return [];

    return this.db
      .select({ shiftInstanceId: schema.timeEntries.shiftInstanceId })
      .from(schema.timeEntries)
      .where(
        and(
          eq(schema.timeEntries.volunteerId, userId),
          inArray(schema.timeEntries.shiftInstanceId, instanceIds),
          isNull(schema.timeEntries.endedAt),
        ),
      );
  }

  /** A user's shift-instance invite statuses across many instances in one query (DataLoader batch). */
  async findInviteStatusesForUser(
    userId: string,
    instanceIds: string[],
  ): Promise<{ shiftInstanceId: string; status: ShiftInviteStatus }[]> {
    if (instanceIds.length === 0) return [];

    const rows = await this.db
      .select({
        shiftInstanceId: schema.shiftInstanceInvites.instanceId,
        status: schema.shiftInstanceInvites.status,
      })
      .from(schema.shiftInstanceInvites)
      .where(
        and(
          eq(schema.shiftInstanceInvites.userId, userId),
          inArray(schema.shiftInstanceInvites.instanceId, instanceIds),
        ),
      );

    return rows.map((row) => ({
      shiftInstanceId: row.shiftInstanceId,
      status: row.status as ShiftInviteStatus,
    }));
  }

  /** The volunteer's open (not-yet-checked-out) time entry for an instance, if any. */
  async findOpenTimeEntry(
    instanceId: string,
    userId: string,
  ): Promise<typeof schema.timeEntries.$inferSelect | null> {
    const [entry] = await this.db
      .select()
      .from(schema.timeEntries)
      .where(
        and(
          eq(schema.timeEntries.shiftInstanceId, instanceId),
          eq(schema.timeEntries.volunteerId, userId),
          isNull(schema.timeEntries.endedAt),
        ),
      )
      .limit(1);

    return entry ?? null;
  }

  async hasOpenTimeEntry(instanceId: string, userId: string): Promise<boolean> {
    return (await this.findOpenTimeEntry(instanceId, userId)) !== null;
  }

  async findInstanceWithMaster(
    instanceId: string,
  ): Promise<ShiftInstanceEntity & { master: ShiftEntity }> {
    const instance = await this.db.query.shiftInstances.findFirst({
      where: { id: instanceId },
      with: { master: true },
    });

    if (!instance?.master) {
      throw new NotFoundGraphQLError(
        `Shift instance with ID ${instanceId} not found`,
      );
    }

    return instance as ShiftInstanceEntity & { master: ShiftEntity };
  }

  async isVolunteerBooked(
    instanceId: string,
    userId: string,
  ): Promise<boolean> {
    const invites = await this.db
      .select()
      .from(schema.shiftInstanceInvites)
      .where(
        and(
          eq(schema.shiftInstanceInvites.instanceId, instanceId),
          eq(schema.shiftInstanceInvites.userId, userId),
          inArray(schema.shiftInstanceInvites.status, [
            ...PARTICIPATING_SHIFT_INVITE_STATUSES,
          ]),
        ),
      )
      .limit(1);

    return invites.length > 0;
  }

  private async getAccessibleOrganizationUnitIds(
    userId: string,
  ): Promise<string[]> {
    const units = await this.organizationService.findUnits(userId);
    return units.map((unit) => unit.id);
  }

  private getStartOfToday(): Date {
    return startOfTodayInAppTimeZone();
  }

  async findMyShiftInstances(
    userId: string,
    includePast: boolean,
    startsAfter: Date | null,
    endsBefore: Date | null,
    limit: number,
    offset: number,
    order: SortOrder,
    statuses: readonly ShiftInviteStatus[] = PARTICIPATING_SHIFT_INVITE_STATUSES,
  ): Promise<{ instances: ShiftInstanceEntity[]; total: number }> {
    const organizationUnitIds =
      await this.getAccessibleOrganizationUnitIds(userId);

    if (organizationUnitIds.length === 0) {
      return EMPTY_SHIFT_INSTANCE_PAGE;
    }

    const dateCondition = this.buildMyShiftDateCondition(
      includePast,
      startsAfter,
      endsBefore,
    );

    const where = {
      isCancelled: false,
      ...dateCondition,
      master: {
        isDeleted: false,
        organizationUnitId: { in: organizationUnitIds },
      },
      invites: {
        userId,
        status: { in: [...statuses] },
      },
    };

    const orderBy = {
      actualStartsAt: order.toLowerCase() as 'asc' | 'desc',
    };

    const [instances, totalResult] = await Promise.all([
      this.db.query.shiftInstances.findMany({
        where,
        with: { master: true },
        orderBy,
        limit,
        offset,
      }),
      this.db.query.shiftInstances.findMany({
        where,
        columns: {},
        extras: { total: count() },
      }),
    ]);

    return { instances, total: totalResult[0]?.total ?? 0 };
  }

  private buildMyShiftDateCondition(
    includePast: boolean,
    startsAfter: Date | null,
    endsBefore: Date | null,
  ): Record<string, unknown> {
    if (endsBefore) {
      return { actualEndsAt: { lt: endsBefore } };
    }

    if (startsAfter) {
      return { actualStartsAt: { gte: startsAfter } };
    }

    if (!includePast) {
      return { actualEndsAt: { gte: new Date() } };
    }

    return {};
  }

  async findAvailableShiftInstances(
    userId: string,
    startsAfter: Date | null,
    endsBefore: Date | null,
    organizationUnitIds: string[] | null,
    limit: number,
    offset: number,
  ): Promise<{ instances: ShiftInstanceEntity[]; total: number }> {
    const userOrganizationUnitIds =
      await this.getAccessibleOrganizationUnitIds(userId);

    if (userOrganizationUnitIds.length === 0) {
      return EMPTY_SHIFT_INSTANCE_PAGE;
    }

    const effectiveOrgUnitIds = organizationUnitIds?.length
      ? organizationUnitIds.filter((id) => userOrganizationUnitIds.includes(id))
      : userOrganizationUnitIds;

    if (effectiveOrgUnitIds.length === 0) {
      return EMPTY_SHIFT_INSTANCE_PAGE;
    }

    const startOfToday = this.getStartOfToday();
    const effectiveStartsAfter = startsAfter ?? startOfToday;
    const effectiveEndsBefore =
      endsBefore ?? new Date('2099-12-31T23:59:59.999Z');

    const where = {
      isCancelled: false,
      actualStartsAt: { gte: effectiveStartsAfter, lte: effectiveEndsBefore },
      master: {
        isDeleted: false,
        organizationUnitId: { in: effectiveOrgUnitIds },
      },
      NOT: {
        invites: {
          userId,
          status: { in: [...PARTICIPATING_SHIFT_INVITE_STATUSES] },
        },
      },
      OR: [
        { master: { visibility: ShiftVisibility.ALL_MEMBERS } },
        { invites: { userId, status: ShiftInviteStatus.INVITED } },
      ],
    };

    const [instances, totalResult] = await Promise.all([
      this.db.query.shiftInstances.findMany({
        where,
        with: { master: true },
        orderBy: { actualStartsAt: 'asc' },
        limit,
        offset,
      }),
      this.db.query.shiftInstances.findMany({
        where,
        columns: {},
        extras: { total: count() },
      }),
    ]);

    return { instances, total: totalResult[0]?.total ?? 0 };
  }

  async findAll(
    userId: string,
    organizationUnitId: string,
    pagination: PaginationInput,
  ): Promise<{ shifts: ShiftEntity[]; total: number }> {
    const canViewAllShifts = await this.authService.hasRequiredPermissions(
      userId,
      organizationUnitId,
      [PERMISSIONS.SHIFT_VIEW],
    );

    if (canViewAllShifts) {
      return this.findAllForOrgUnit(organizationUnitId, pagination);
    }

    return this.findAllVisibleToMember(userId, organizationUnitId, pagination);
  }

  private async findAllForOrgUnit(
    organizationUnitId: string,
    pagination: PaginationInput,
  ): Promise<{ shifts: ShiftEntity[]; total: number }> {
    const shifts = await this.db.query.shifts.findMany({
      where: {
        organizationUnitId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const totalResult = await this.db.query.shifts.findMany({
      where: {
        organizationUnitId,
        isDeleted: false,
      },
      columns: {},
      extras: { total: count() },
    });

    return { shifts, total: totalResult[0]?.total ?? 0 };
  }

  private async findVisibleShiftIdsForMember(
    userId: string,
    organizationUnitId: string,
  ): Promise<string[]> {
    const [openShifts, joinedShifts] = await Promise.all([
      this.db.query.shifts.findMany({
        where: {
          organizationUnitId,
          isDeleted: false,
          visibility: ShiftVisibility.ALL_MEMBERS,
        },
        columns: { id: true, createdAt: true },
      }),
      this.db.query.shifts.findMany({
        where: {
          organizationUnitId,
          isDeleted: false,
          instances: {
            invites: {
              userId,
            },
          },
        },
        columns: { id: true, createdAt: true },
      }),
    ]);

    return this.dedupAndSortByCreation([...openShifts, ...joinedShifts]);
  }

  private async findAllVisibleToMember(
    userId: string,
    organizationUnitId: string,
    pagination: PaginationInput,
  ): Promise<{ shifts: ShiftEntity[]; total: number }> {
    const visibleShiftIds = await this.findVisibleShiftIdsForMember(
      userId,
      organizationUnitId,
    );
    const total = visibleShiftIds.length;

    if (total === 0) {
      return { shifts: [], total: 0 };
    }

    const paginatedIds = visibleShiftIds.slice(
      pagination.offset,
      pagination.offset + pagination.limit,
    );

    const shifts = await this.db.query.shifts.findMany({
      where: { id: { in: paginatedIds } },
    });

    const shiftsById = new Map(shifts.map((shift) => [shift.id, shift]));
    const orderedShifts = paginatedIds
      .map((id) => shiftsById.get(id))
      .filter((shift): shift is ShiftEntity => shift !== undefined);

    return { shifts: orderedShifts, total };
  }

  private dedupAndSortByCreation(
    shifts: Array<{ id: string; createdAt: Date }>,
  ): string[] {
    const byId = new Map<string, Date>();

    for (const shift of shifts) {
      const existing = byId.get(shift.id);
      if (!existing || shift.createdAt > existing) {
        byId.set(shift.id, shift.createdAt);
      }
    }

    return [...byId.entries()]
      .sort(([, a], [, b]) => b.getTime() - a.getTime())
      .map(([id]) => id);
  }

  private async assertShiftWindowValid(
    startsAt: Date,
    endsAt: Date,
    eventId: string,
    organizationUnitId: string,
  ): Promise<void> {
    const event = await this.db.query.events.findFirst({
      where: { id: eventId, organizationUnitId, isDeleted: false },
      columns: { startsAt: true, endsAt: true },
    });

    if (!event) {
      throw new NotFoundGraphQLError(`Event with ID ${eventId} not found`);
    }

    if (startsAt < event.startsAt || endsAt > event.endsAt) {
      throw new BadRequestGraphQLError('shift_window_violation');
    }
  }

  async create(
    userId: string,
    organizationUnitId: string,
    input: CreateShiftInput,
  ): Promise<ShiftEntity> {
    const {
      invitedMemberIds,
      eventId,
      imageFileId,
      requiredFormIds,
      ...shiftInput
    } = input;
    const durationMinutes = getDurationMinutes(
      shiftInput.startsAt,
      shiftInput.endsAt,
    );
    const imageUrl = imageFileId
      ? await this.resolveImageUrl(imageFileId)
      : null;

    if (eventId) {
      await this.assertShiftWindowValid(
        shiftInput.startsAt,
        shiftInput.endsAt,
        eventId,
        organizationUnitId,
      );
    }

    const shift = await this.db.transaction(async (tx) => {
      const [shift] = await tx
        .insert(schema.shifts)
        .values({
          title: shiftInput.title,
          slug: slugify(shiftInput.title),
          instructions: shiftInput.instructions,
          organizationUnitId,
          createdById: userId,
          location: shiftInput.location,
          imageUrl,
          visibility: shiftInput.visibility,
          maxVolunteers: shiftInput.maxVolunteers,
          minVolunteers: shiftInput.minVolunteers,
          rrule: shiftInput.rrule,
          originalStartsAt: shiftInput.startsAt,
          durationMinutes,
          eventId: eventId ?? null,
        })
        .returning();

      const instances = expandShift(
        shift.rrule,
        shift.originalStartsAt,
        shift.durationMinutes,
      );

      if (instances.length > 0) {
        await tx.insert(schema.shiftInstances).values(
          instances.map((inst) => ({
            masterId: shift.id,
            actualStartsAt: inst.actualStartsAt,
            actualEndsAt: inst.actualEndsAt,
            occurrenceIndex: inst.occurrenceIndex,
          })),
        );

        if (invitedMemberIds?.length) {
          const createdInstances = await tx.query.shiftInstances.findMany({
            where: { masterId: shift.id },
            columns: { id: true },
          });
          await this.createInvitesForInstances(
            tx,
            createdInstances.map((i) => i.id),
            this.toInviteMembers(invitedMemberIds, ShiftInviteStatus.INVITED),
          );
        }
      }

      if (requiredFormIds && requiredFormIds.length > 0) {
        await this.setRequiredFormsInTx(
          tx,
          shift.id,
          organizationUnitId,
          requiredFormIds,
        );
      }

      return shift;
    });

    void this.loadAndEmitShiftInvitedNotification(shift, invitedMemberIds);

    return shift;
  }

  private readonly MAX_INVITES_PER_OPERATION = 100000; // same as below easy guard to avoid unreasonable operations

  private toInviteMembers(
    memberIds: string[],
    status: ShiftInviteStatus,
  ): InviteMemberInput[] {
    return memberIds.map((userId) => ({ userId, status }));
  }

  private async createInvitesForInstances(
    tx: Pick<Database, 'insert' | 'select'>,
    instanceIds: string[],
    members: InviteMemberInput[],
  ): Promise<void> {
    if (members.length === 0 || instanceIds.length === 0) return;

    const totalInvites = instanceIds.length * members.length;
    if (totalInvites > this.MAX_INVITES_PER_OPERATION) {
      throw new ConflictGraphQLError(
        `Cannot create ${totalInvites} invites. Maximum allowed is ${this.MAX_INVITES_PER_OPERATION}. ` +
          `Try reducing volunteers or using smaller recurrence ranges.`,
      );
    }

    const BATCH_SIZE = 1000; // this manual batch is just an easy guard to avoid going over the 65k pg limit
    const invites = instanceIds.flatMap((instanceId) =>
      members.map(({ userId, status }) => ({
        instanceId,
        userId,
        status,
      })),
    );

    for (let i = 0; i < invites.length; i += BATCH_SIZE) {
      const batch = invites.slice(i, i + BATCH_SIZE);
      await tx
        .insert(schema.shiftInstanceInvites)
        .values(batch)
        .onConflictDoNothing();
    }
  }

  private async createInvitesForShift(
    tx: Pick<Database, 'insert' | 'update' | 'query'>,
    shiftId: string,
    members: InviteMemberInput[],
  ): Promise<void> {
    if (members.length === 0) return;

    const BATCH_SIZE = 1000;
    for (let i = 0; i < members.length; i += BATCH_SIZE) {
      const batch = members.slice(i, i + BATCH_SIZE);
      for (const member of batch) {
        const [inserted] = await tx
          .insert(schema.shiftInvites)
          .values({
            shiftId,
            userId: member.userId,
            status: member.status,
          })
          .onConflictDoUpdate({
            target: [schema.shiftInvites.shiftId, schema.shiftInvites.userId],
            set: { status: member.status },
          })
          .returning({ id: schema.shiftInvites.id });

        if (inserted) {
          await propagateShiftInviteStatusToFutureInstances(
            tx,
            shiftId,
            member.userId,
            member.status,
          );
        }
      }
    }
  }

  async inviteMembersToShiftInstance(
    tx: Database,
    shiftInstance: InferResultType<
      'shiftInstances',
      {
        invites: {
          columns: {
            userId: true;
          };
        };
        master: true;
      }
    >,
    memberIds: string[],
    inviteStatus: ShiftInviteStatus = ShiftInviteStatus.INVITED,
  ): Promise<void> {
    if (memberIds.length === 0) {
      return;
    }
    const maxVolunteers =
      shiftInstance.overrideMaxVolunteers ?? shiftInstance.master.maxVolunteers;

    if (
      maxVolunteers &&
      shiftInstance.invites.length + memberIds.length > maxVolunteers
    ) {
      throw new ConflictGraphQLError(
        `Cannot invite members: instance would exceed capacity of ${maxVolunteers}`,
      );
    }

    await this.createInvitesForInstances(
      tx,
      [shiftInstance.id],
      this.toInviteMembers(memberIds, inviteStatus),
    );
    void this.loadAndEmitShiftInstanceInvitedNotification(
      shiftInstance.master,
      shiftInstance,
      memberIds,
    );
  }

  async uninviteMembersFromShiftInstance(
    tx: Database,
    instanceId: string,
    membersToRemoveIds: string[],
  ): Promise<void> {
    if (membersToRemoveIds.length > 0) {
      await tx
        .delete(schema.shiftInstanceInvites)
        .where(
          and(
            eq(schema.shiftInstanceInvites.instanceId, instanceId),
            inArray(schema.shiftInstanceInvites.userId, membersToRemoveIds),
          ),
        );
    }
  }

  async updateMembersForShiftInstance(
    shiftInstanceId: string,
    memberIds: string[],
    organizationUnitId: string,
    options: {
      inviteToAllInstances?: boolean | null;
      inviteStatus?: ShiftInviteStatus;
    } = {},
  ): Promise<ShiftInstanceEntity> {
    const inviteStatus = options.inviteStatus ?? ShiftInviteStatus.INVITED;
    const currentShiftInstance = await this.db.query.shiftInstances.findFirst({
      where: {
        id: shiftInstanceId,
        master: {
          organizationUnitId: organizationUnitId,
          isDeleted: false,
        },
        isCancelled: false,
      },
      with: {
        invites: {
          columns: {
            userId: true,
            status: true,
          },
        },
        master: true,
      },
    });
    if (!currentShiftInstance) {
      throw new NotFoundGraphQLError(
        `Shift instance with ID ${shiftInstanceId} not found`,
      );
    }

    // Only active (pending or participating) invites count as "currently
    // invited" — REJECTED/CANCELLED rows must not block re-invites or
    // trigger removals.
    const activeStatuses: readonly string[] = ACTIVE_SHIFT_INVITE_STATUSES;
    const currentInstanceInviteUserIds = currentShiftInstance.invites
      .filter((inv) => activeStatuses.includes(inv.status))
      .map((inv) => inv.userId);
    const { userIdsToAdd, userIdsToRemove } = this.getUserIdDifferences(
      currentInstanceInviteUserIds,
      memberIds,
    );

    await this.db.transaction(async (tx) => {
      if (!options.inviteToAllInstances) {
        if (userIdsToAdd.length > 0) {
          await this.inviteMembersToShiftInstance(
            tx,
            currentShiftInstance,
            userIdsToAdd,
            inviteStatus,
          );
          // Resurrect pre-existing inactive (REJECTED/CANCELLED) invite rows —
          // the insert above no-ops on conflict for those.
          await tx
            .update(schema.shiftInstanceInvites)
            .set({ status: inviteStatus })
            .where(
              and(
                eq(schema.shiftInstanceInvites.instanceId, shiftInstanceId),
                inArray(schema.shiftInstanceInvites.userId, userIdsToAdd),
              ),
            );
        }
        if (userIdsToRemove.length > 0) {
          await this.uninviteMembersFromShiftInstance(
            tx,
            shiftInstanceId,
            userIdsToRemove,
          );
        }
      } else {
        const shift = currentShiftInstance.master;

        if (userIdsToRemove.length > 0) {
          await tx
            .delete(schema.shiftInvites)
            .where(
              and(
                eq(schema.shiftInvites.shiftId, shift.id),
                inArray(schema.shiftInvites.userId, userIdsToRemove),
              ),
            );
        }

        if (userIdsToAdd.length > 0) {
          await this.createInvitesForShift(
            tx,
            shift.id,
            this.toInviteMembers(userIdsToAdd, inviteStatus),
          );
        }

        // update shift instance invites

        const fromDate = currentShiftInstance.actualStartsAt;
        const futureShiftInstances = await tx.query.shiftInstances.findMany({
          where: {
            masterId: shift.id,
            isCancelled: false,
            ...(fromDate ? { actualStartsAt: { gte: fromDate } } : {}),
          },
          columns: {
            id: true,
          },
        });

        if (futureShiftInstances.length === 0) {
          return;
        }

        const futureShiftInstanceIds = futureShiftInstances.map(
          (instance) => instance.id,
        );

        await tx
          .delete(schema.shiftInstanceInvites)
          .where(
            and(
              inArray(
                schema.shiftInstanceInvites.instanceId,
                futureShiftInstanceIds,
              ),
              inArray(schema.shiftInstanceInvites.userId, userIdsToRemove),
            ),
          );

        const futureShiftInstancesWithInvites =
          await tx.query.shiftInstances.findMany({
            where: {
              masterId: shift.id,
              isCancelled: false,
              ...(fromDate ? { actualStartsAt: { gte: fromDate } } : {}),
            },
            columns: {
              id: true,
              overrideMaxVolunteers: true,
            },
            with: {
              invites: {
                columns: {
                  userId: true,
                  status: true,
                },
              },
            },
          });

        const toAddByInstance = new Map<string, string[]>();
        for (const instance of futureShiftInstancesWithInvites) {
          const capacity =
            instance.overrideMaxVolunteers ?? shift.maxVolunteers;
          const invitedUserIds = new Set(
            instance.invites
              .filter((invite) => activeStatuses.includes(invite.status))
              .map((invite) => invite.userId),
          );
          const membersToAdd = userIdsToAdd.filter(
            (id) => !invitedUserIds.has(id),
          );
          if (
            capacity &&
            membersToAdd.length + instance.invites.length > capacity
          ) {
            throw new ConflictGraphQLError(
              `Cannot invite members: instance would exceed capacity of ${capacity}`,
            );
          }
          toAddByInstance.set(instance.id, membersToAdd);
        }

        for (const [instanceId, userIds] of toAddByInstance) {
          await this.createInvitesForInstances(
            tx,
            [instanceId],
            this.toInviteMembers(userIds, inviteStatus),
          );
        }

        // Resurrect pre-existing inactive (REJECTED/CANCELLED) invite rows —
        // the inserts above no-op on conflict for those.
        if (userIdsToAdd.length > 0) {
          await tx
            .update(schema.shiftInstanceInvites)
            .set({ status: inviteStatus })
            .where(
              and(
                inArray(
                  schema.shiftInstanceInvites.instanceId,
                  futureShiftInstanceIds,
                ),
                inArray(schema.shiftInstanceInvites.userId, userIdsToAdd),
              ),
            );
        }
      }
    });

    // Emit notifications after successful commit
    if (userIdsToAdd.length > 0) {
      if (!options.inviteToAllInstances) {
        void this.loadAndEmitShiftInstanceInvitedNotification(
          currentShiftInstance.master,
          currentShiftInstance,
          userIdsToAdd,
        );
      } else {
        void this.loadAndEmitShiftInvitedNotification(
          currentShiftInstance.master,
          userIdsToAdd,
        );
      }
    }

    return currentShiftInstance;
  }

  async updateShiftInstance(
    instanceId: string,
    input: UpdateShiftInstanceInput,
    organizationUnitId: string,
    options: { applyToAllFuture?: boolean } = {},
  ): Promise<ShiftInstanceEntity> {
    return this.db.transaction(async (tx) => {
      const instance = await tx.query.shiftInstances.findFirst({
        where: { id: instanceId },
        with: { master: true },
      });

      if (
        !instance ||
        instance.master.organizationUnitId !== organizationUnitId
      ) {
        throw new NotFoundGraphQLError(
          `Shift instance with ID ${instanceId} not found`,
        );
      }

      if (instance.actualEndsAt.getTime() < Date.now()) {
        throw new ConflictGraphQLError(
          'Cannot edit a past or completed shift instance',
        );
      }

      if (!options.applyToAllFuture) {
        return this.updateSingleShiftInstance(tx, instance, input);
      }

      return this.updateShiftInstanceSeries(
        tx,
        instance,
        input,
        organizationUnitId,
      );
    });
  }

  private async updateSingleShiftInstance(
    tx: Database,
    instance: ShiftInstanceEntity & { master: ShiftEntity },
    input: UpdateShiftInstanceInput,
  ): Promise<ShiftInstanceEntity> {
    const startsAtChanged =
      input.startsAt.getTime() !== instance.actualStartsAt.getTime();

    if (startsAtChanged) {
      const [collision] = await tx
        .select({ id: schema.shiftInstances.id })
        .from(schema.shiftInstances)
        .where(
          and(
            eq(schema.shiftInstances.masterId, instance.masterId),
            ne(schema.shiftInstances.id, instance.id),
            eq(schema.shiftInstances.actualStartsAt, input.startsAt),
            eq(schema.shiftInstances.isCancelled, false),
          ),
        )
        .limit(1);

      if (collision) {
        throw new ConflictGraphQLError(
          'Another instance of this shift already starts at that time',
        );
      }
    }

    const [updated] = await tx
      .update(schema.shiftInstances)
      .set({
        overrideTitle: input.title,
        overrideLocation: input.location ?? null,
        overrideInstructions: input.instructions ?? null,
        overrideMinVolunteers: input.minVolunteers ?? null,
        overrideMaxVolunteers: input.maxVolunteers ?? null,
        actualStartsAt: input.startsAt,
        actualEndsAt: input.endsAt,
        isException: true,
      })
      .where(eq(schema.shiftInstances.id, instance.id))
      .returning();

    if (!updated) {
      throw new NotFoundGraphQLError(
        `Shift instance with ID ${instance.id} not found`,
      );
    }

    return updated;
  }

  private async updateShiftInstanceSeries(
    _tx: Database,
    instance: ShiftInstanceEntity & { master: ShiftEntity },
    _input: UpdateShiftInstanceInput,
    _organizationUnitId: string,
  ): Promise<ShiftInstanceEntity> {
    return instance;
  }

  private getUserIdDifferences(currentUserIds: string[], newUserIds: string[]) {
    const userIdsToAdd = newUserIds.filter(
      (id) => !currentUserIds.includes(id),
    );
    const userIdsToRemove = currentUserIds.filter(
      (id) => !newUserIds.includes(id),
    );
    return { userIdsToAdd, userIdsToRemove };
  }

  async findVolunteers(
    instanceId: string,
    organizationUnitId: string,
    statuses: readonly ShiftInviteStatus[] = PARTICIPATING_SHIFT_INVITE_STATUSES,
  ): Promise<UserEntity[]> {
    const instance = await this.findInstanceById(
      instanceId,
      organizationUnitId,
    );

    return this.db.query.users.findMany({
      where: {
        shiftInstanceInvites: {
          instanceId: instance.id,
          status: { in: [...statuses] },
        },
      },
    });
  }

  /** Invites for many instances in one query (DataLoader batch). */
  async findInstanceInvitesByInstanceIds(
    instanceIds: string[],
    organizationUnitId: string,
    statuses?: readonly ShiftInviteStatus[] | null,
  ): Promise<ShiftInstanceInviteEntity[]> {
    if (instanceIds.length === 0) {
      return [];
    }

    return this.db.query.shiftInstanceInvites.findMany({
      where: {
        instanceId: { in: instanceIds },
        instance: {
          master: { organizationUnitId, isDeleted: false },
        },
        ...(statuses?.length ? { status: { in: [...statuses] } } : {}),
      },
      // Tie-break on id so batch invites (same createdAt) keep stable order after updates.
      orderBy: { createdAt: 'asc', id: 'asc' },
    });
  }

  async findInstanceInvites(
    instanceId: string,
    organizationUnitId: string,
    statuses?: readonly ShiftInviteStatus[] | null,
  ): Promise<ShiftInstanceInviteEntity[]> {
    await this.findInstanceById(instanceId, organizationUnitId);

    return this.findInstanceInvitesByInstanceIds(
      [instanceId],
      organizationUnitId,
      statuses,
    );
  }

  async findUsersByIds(userIds: string[]): Promise<UserEntity[]> {
    if (userIds.length === 0) {
      return [];
    }
    return this.db.query.users.findMany({
      where: { id: { in: userIds } },
    });
  }

  async findInvites(
    organizationUnitId: string,
    instanceIds: string[],
    userIds: string[],
  ): Promise<ShiftInstanceInviteEntity[]> {
    if (instanceIds.length === 0 || userIds.length === 0) {
      return [];
    }
    const instanceInvites = this.db.query.shiftInstanceInvites.findMany({
      where: {
        userId: { in: userIds },
        instance: {
          id: { in: instanceIds },
          master: { organizationUnitId, isDeleted: false },
          isCancelled: false,
        },
      },
    });

    return instanceInvites;
  }

  async countByEventIds(eventIds: string[]) {
    if (eventIds.length === 0) {
      return [];
    }

    return this.db
      .select({
        eventId: schema.shifts.eventId,
        count: count(),
      })
      .from(schema.shifts)
      .where(
        and(
          inArray(schema.shifts.eventId, eventIds),
          eq(schema.shifts.isDeleted, false),
        ),
      )
      .groupBy(schema.shifts.eventId);
  }

  async findAllForEvent(
    eventId: string,
    organizationUnitId: string,
    pagination: PaginationInput,
  ): Promise<{ shifts: ShiftEntity[]; total: number }> {
    const shifts = await this.db.query.shifts.findMany({
      where: {
        eventId,
        organizationUnitId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const totalResult = await this.db.query.shifts.findMany({
      where: {
        eventId,
        organizationUnitId,
        isDeleted: false,
      },
      columns: {},
      extras: { total: count() },
    });

    return { shifts, total: totalResult[0]?.total ?? 0 };
  }

  async findByEventIds(eventIds: string[]): Promise<ShiftEntity[]> {
    if (eventIds.length === 0) {
      return [];
    }
    return this.db.query.shifts.findMany({
      where: { eventId: { in: eventIds }, isDeleted: false },
      orderBy: { originalStartsAt: 'asc' },
    });
  }

  async update(
    userId: string,
    id: string,
    organizationUnitId: string,
    input: UpdateShiftInput,
  ): Promise<ShiftEntity> {
    const {
      invitedMemberIds,
      eventId: inputEventId,
      imageFileId,
      requiredFormIds,
      ...shiftInput
    } = input;

    return this.db.transaction(async (tx) => {
      let shift = await tx.query.shifts.findFirst({
        where: { id, organizationUnitId },
      });

      if (!shift) {
        throw new NotFoundGraphQLError('Shift not found');
      }

      const previousSeries = {
        rrule: shift.rrule,
        originalStartsAt: shift.originalStartsAt,
        durationMinutes: shift.durationMinutes,
      };

      const effectiveEventId =
        inputEventId !== undefined ? inputEventId : shift.eventId;
      const effectiveStartsAt = shiftInput.startsAt ?? shift.originalStartsAt;
      const effectiveEndsAt =
        shiftInput.endsAt ??
        new Date(
          shift.originalStartsAt.getTime() + shift.durationMinutes * 60000,
        );

      if (effectiveEventId) {
        await this.assertShiftWindowValid(
          effectiveStartsAt,
          effectiveEndsAt,
          effectiveEventId,
          organizationUnitId,
        );
      }

      const hasValuesToUpdate =
        Object.keys(shiftInput).length > 0 ||
        inputEventId !== undefined ||
        imageFileId !== undefined;

      if (hasValuesToUpdate) {
        const durationMinutes =
          input.endsAt && input.startsAt
            ? getDurationMinutes(input.startsAt, input.endsAt)
            : undefined;

        const imageUrl =
          imageFileId === undefined
            ? undefined
            : imageFileId
              ? await this.resolveImageUrl(imageFileId)
              : null;

        const [updatedShift] = await tx
          .update(schema.shifts)
          .set({
            ...shiftInput,
            slug: shiftInput.title ? slugify(shiftInput.title) : undefined,
            originalStartsAt: input.startsAt,
            durationMinutes,
            ...(inputEventId !== undefined ? { eventId: inputEventId } : {}),
            ...(imageUrl !== undefined ? { imageUrl } : {}),
          })
          .where(
            and(
              eq(schema.shifts.id, id),
              eq(schema.shifts.organizationUnitId, organizationUnitId),
            ),
          )
          .returning();

        shift = updatedShift;
      }

      const wasRecurring = previousSeries.rrule !== null;
      const isRecurring = shift.rrule !== null;

      if (wasRecurring || isRecurring) {
        const seriesChanged =
          shift.rrule !== previousSeries.rrule ||
          shift.originalStartsAt.getTime() !==
            previousSeries.originalStartsAt.getTime() ||
          shift.durationMinutes !== previousSeries.durationMinutes;

        if (seriesChanged) {
          const target = expandShift(
            shift.rrule,
            shift.originalStartsAt,
            shift.durationMinutes,
          );
          await syncShiftInstances(tx, id, target);
        }
      } else if (input.startsAt && input.endsAt) {
        // One-off shift: move the single instance in place, preserving signups.
        await tx
          .update(schema.shiftInstances)
          .set({
            actualStartsAt: input.startsAt,
            actualEndsAt: input.endsAt,
          })
          .where(
            and(
              eq(schema.shiftInstances.masterId, id),
              eq(schema.shiftInstances.isException, false),
              eq(schema.shiftInstances.isCancelled, false),
            ),
          );
      }

      if (
        shiftInput.visibility &&
        shift?.visibility === ShiftVisibility.ALL_MEMBERS &&
        shiftInput.visibility === ShiftVisibility.INVITED_MEMBERS
      ) {
        const instances = await tx.query.shiftInstances.findMany({
          where: { masterId: id },
          columns: { id: true },
        });
        const instanceIds = instances.map((i) => i.id);
        if (instanceIds.length > 0) {
          await tx
            .delete(schema.shiftInstanceInvites)
            .where(
              inArray(schema.shiftInstanceInvites.instanceId, instanceIds),
            );
        }
      }

      if (requiredFormIds !== undefined) {
        await this.setRequiredFormsInTx(
          tx,
          shift.id,
          organizationUnitId,
          requiredFormIds ?? [],
        );
      }

      return shift;
    });
  }

  async delete(id: string, organizationUnitId: string): Promise<ShiftEntity> {
    const [shift] = await this.db
      .update(schema.shifts)
      .set({ isDeleted: true })
      .where(
        and(
          eq(schema.shifts.id, id),
          eq(schema.shifts.organizationUnitId, organizationUnitId),
        ),
      )
      .returning();

    if (!shift) {
      throw new NotFoundGraphQLError(`Shift with ID ${id} not found`);
    }

    return shift;
  }

  async findActiveShiftInstances(
    organizationUnitId: string,
  ): Promise<ShiftInstanceEntity[]> {
    const now = new Date();
    const threeHours = 3 * 60 * 60 * 1000;
    const threeHoursAgo = new Date(now.getTime() - threeHours);
    const threeHoursFromNow = new Date(now.getTime() + threeHours);

    const instances = await this.db.query.shiftInstances.findMany({
      where: {
        actualStartsAt: { lt: threeHoursFromNow },
        actualEndsAt: { gt: threeHoursAgo },
        isCancelled: false,
        master: { organizationUnitId, isDeleted: false },
      },
      with: {
        master: true,
      },
      //orderBy: { actualStartsAt: 'asc' },
    });

    return instances;
  }

  async findInstances(
    shiftId: string,
    organizationUnitId: string,
  ): Promise<ShiftInstanceEntity[]> {
    const shift = await this.db.query.shifts.findFirst({
      where: { id: shiftId, organizationUnitId, isDeleted: false },
      columns: { id: true },
    });

    if (!shift) {
      throw new NotFoundGraphQLError('Shift not found');
    }

    return this.db.query.shiftInstances.findMany({
      where: {
        masterId: shiftId,
        isCancelled: false,
      },
      orderBy: { actualStartsAt: 'asc' },
    });
  }

  async findShiftsForWeek(
    organizationUnitId: string,
    from: Date,
    to: Date,
  ): Promise<ShiftInstanceEntity[]> {
    const shifts = await this.db.query.shifts.findMany({
      where: { organizationUnitId, isDeleted: false },
      columns: { id: true },
    });
    const shiftIds = shifts.map((s) => s.id);
    if (shiftIds.length === 0) return [];

    return this.db.query.shiftInstances.findMany({
      where: {
        masterId: { in: shiftIds },
        actualStartsAt: { gte: from, lt: to },
        isCancelled: false,
      },
      with: { master: true },
      orderBy: { actualStartsAt: 'asc' },
    });
  }

  async findCreator(createdById: string): Promise<UserEntity> {
    return this.userService.findByIdOrThrow(createdById);
  }

  private async loadAndEmitShiftInstanceInvitedNotification(
    shift: ShiftEntity,
    instance: ShiftInstanceEntity,
    invitedUserIds: string[],
  ): Promise<void> {
    if (invitedUserIds.length === 0) {
      return;
    }
    try {
      const organizationUnit = await this.db.query.organizationUnits.findFirst({
        where: { id: shift.organizationUnitId },
        columns: { id: true, name: true },
      });

      if (!organizationUnit) {
        return;
      }

      this.notificationService.notifyShiftInstanceInvited({
        organizationUnitId: organizationUnit.id,
        organizationUnitName: organizationUnit.name,
        shiftId: shift.id,
        shiftTitle: shift.title,
        shiftLocation: shift.location,
        shiftInstructions:
          instance.overrideInstructions ?? shift.instructions ?? null,
        recipientUserIds: invitedUserIds,
        startsAt: instance.actualStartsAt,
        endsAt: instance.actualEndsAt,
        instanceId: instance.id,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit shift instance invited notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async loadAndEmitShiftInvitedNotification(
    shift: ShiftEntity,
    invitedUserIds?: string[] | null,
  ): Promise<void> {
    if (!invitedUserIds || invitedUserIds.length === 0) {
      return;
    }

    try {
      const [organizationUnit, instances] = await Promise.all([
        this.db.query.organizationUnits.findFirst({
          where: { id: shift.organizationUnitId },
          columns: { id: true, name: true },
        }),
        this.db.query.shiftInstances.findMany({
          where: {
            masterId: shift.id,
            isCancelled: false,
          },
          orderBy: { actualStartsAt: 'asc' },
          columns: {
            actualStartsAt: true,
            actualEndsAt: true,
          },
        }),
      ]);

      if (!organizationUnit) {
        return;
      }

      const schedule = buildShiftInviteSchedule(
        shift,
        instances.map((instance) => ({
          startsAt: instance.actualStartsAt,
          endsAt: instance.actualEndsAt,
        })),
      );

      this.notificationService.notifyShiftInvited({
        organizationUnitId: organizationUnit.id,
        organizationUnitName: organizationUnit.name,
        shiftId: shift.id,
        shiftTitle: shift.title,
        shiftLocation: shift.location,
        shiftInstructions: shift.instructions ?? null,
        recipientUserIds: invitedUserIds,
        schedule,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit shift invited notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async notifyShiftInstanceJoined(
    userId: string,
    shift: ShiftEntity,
    instance: ShiftInstanceEntity,
  ): Promise<void> {
    try {
      const organizationUnit = await this.db.query.organizationUnits.findFirst({
        where: { id: shift.organizationUnitId },
        columns: { id: true, name: true },
      });

      if (!organizationUnit) {
        return;
      }

      const shiftManagers = await this.authService.findUsersWithPermission(
        shift.organizationUnitId,
        PERMISSIONS.SHIFT_EDIT,
      );
      const recipientUserIds = shiftManagers
        .filter((manager) => manager.id !== userId)
        .map((manager) => manager.id);

      if (recipientUserIds.length === 0) {
        return;
      }

      this.notificationService.notifyShiftInstanceJoined({
        organizationUnitId: shift.organizationUnitId,
        organizationUnitName: organizationUnit.name,
        shiftTitle: shift.title,
        joinedUserId: userId,
        recipientUserIds,
        startsAt: instance.actualStartsAt,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit shift instance joined notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async joinShiftInstance(
    userId: string,
    instanceId: string,
    status: ShiftInviteStatus = ShiftInviteStatus.ACCEPTED,
    tx?: Database,
    formsAlreadySatisfied?: boolean,
  ): Promise<void> {
    const db = tx ?? this.db;

    const instance = await db.query.shiftInstances.findFirst({
      where: { id: instanceId, isCancelled: false },
      with: { master: true },
    });

    const shift = instance?.master ?? null;

    if (!instance || !shift) {
      throw new NotFoundGraphQLError('Shift not found');
    }

    if (shift.isDeleted || shift.visibility !== ShiftVisibility.ALL_MEMBERS) {
      throw new NotFoundGraphQLError('Shift not found');
    }

    const isAllowed = await this.membershipService.isMemberOfUnitOrAncestor(
      userId,
      shift.organizationUnitId,
    );

    if (!isAllowed) {
      throw new ConflictGraphQLError(
        'You must be a member of the organization to join this shift.',
      );
    }

    if (!formsAlreadySatisfied) {
      const requiredFormStatuses = await this.getShiftRequiredFormStatuses(
        userId,
        shift.id,
      );
      const missingForms = requiredFormStatuses.filter((s) => !s.submitted);
      if (missingForms.length > 0) {
        throw new ConflictGraphQLError(
          'You must complete the required forms before joining this shift.',
        );
      }
    }

    const maxVolunteers = instance.overrideMaxVolunteers ?? shift.maxVolunteers;

    const existingInvite = await db.query.shiftInstanceInvites.findFirst({
      where: {
        instanceId,
        userId,
      },
    });

    if (existingInvite) {
      if (isParticipatingShiftInviteStatus(existingInvite.status)) {
        return;
      }

      if (
        existingInvite.status === ShiftInviteStatus.CANCELLED &&
        status === ShiftInviteStatus.SELF_JOINED
      ) {
        this.assertInviteStatusTransition(
          existingInvite.status,
          ShiftInviteStatus.SELF_JOINED,
        );

        if (maxVolunteers) {
          const [capacity] = await db
            .select({ current: count() })
            .from(schema.shiftInstanceInvites)
            .where(
              and(
                inArray(schema.shiftInstanceInvites.status, [
                  ...PARTICIPATING_SHIFT_INVITE_STATUSES,
                ]),
                eq(schema.shiftInstanceInvites.instanceId, instanceId),
              ),
            );

          if ((capacity?.current ?? 0) >= maxVolunteers) {
            throw new ConflictGraphQLError(
              `Cannot join shift: instance is at full capacity of ${maxVolunteers}`,
            );
          }
        }

        await db
          .update(schema.shiftInstanceInvites)
          .set({ status: ShiftInviteStatus.SELF_JOINED })
          .where(eq(schema.shiftInstanceInvites.id, existingInvite.id));

        void this.notifyShiftInstanceJoined(userId, shift, instance);
      }

      return;
    }

    if (maxVolunteers) {
      const [capacity] = await db
        .select({ current: count() })
        .from(schema.shiftInstanceInvites)
        .where(
          and(
            inArray(schema.shiftInstanceInvites.status, [
              ...PARTICIPATING_SHIFT_INVITE_STATUSES,
            ]),
            eq(schema.shiftInstanceInvites.instanceId, instanceId),
          ),
        );

      if ((capacity?.current ?? 0) >= maxVolunteers) {
        throw new ConflictGraphQLError(
          `Cannot join shift: instance is at full capacity of ${maxVolunteers}`,
        );
      }
    }

    await db
      .insert(schema.shiftInstanceInvites)
      .values({
        instanceId,
        userId,
        status,
      })
      .onConflictDoNothing();

    void this.notifyShiftInstanceJoined(userId, shift, instance);
  }

  async joinShift(userId: string, shiftId: string): Promise<ShiftEntity> {
    const shift = await this.db.query.shifts.findFirst({
      where: { id: shiftId, isDeleted: false },
    });

    if (!shift || shift.visibility !== ShiftVisibility.ALL_MEMBERS) {
      throw new NotFoundGraphQLError('Shift not found');
    }

    const isAllowed = await this.membershipService.isMemberOfUnitOrAncestor(
      userId,
      shift.organizationUnitId,
    );

    if (!isAllowed) {
      throw new ConflictGraphQLError(
        'You must be a member of the organization to join this shift.',
      );
    }

    const requiredFormStatuses = await this.getShiftRequiredFormStatuses(
      userId,
      shiftId,
    );
    const missingForms = requiredFormStatuses.filter((s) => !s.submitted);
    if (missingForms.length > 0) {
      throw new ConflictGraphQLError(
        'You must complete the required forms before joining this shift.',
      );
    }

    const nextShiftInstance = await this.db.query.shiftInstances.findFirst({
      where: {
        masterId: shiftId,
        actualStartsAt: { gte: new Date() },
      },
      orderBy: { actualStartsAt: 'asc' },
    });
    if (nextShiftInstance) {
      const existingShiftInvites = await this.db.query.shiftInvites.findMany({
        where: { shiftId },
        columns: { userId: true },
      });
      const memberIds = [
        ...new Set([
          ...existingShiftInvites.map((invite) => invite.userId),
          userId,
        ]),
      ];

      await this.updateMembersForShiftInstance(
        nextShiftInstance.id,
        memberIds,
        shift.organizationUnitId,
        {
          inviteToAllInstances: true,
          inviteStatus: ShiftInviteStatus.ACCEPTED,
        },
      );
    }

    return shift;
  }

  async requestJoinShiftInstance(
    userId: string,
    instanceId: string,
  ): Promise<{
    status: JoinStatus;
    shiftInstance: ShiftInstanceEntity;
    membershipRequest?: MembershipRequestEntity;
    requirementProfile?: RequirementProfileEntity;
    requirementStatuses?: Array<{
      requirementId: string;
      name: string;
      status: string;
    }>;
    requiredForms?: RequiredFormStatus[];
  }> {
    const instance = await this.db.query.shiftInstances.findFirst({
      where: { id: instanceId, isCancelled: false },
      with: { master: true },
    });

    const shift = instance?.master ?? null;

    if (!shift || shift.isDeleted) {
      throw new NotFoundGraphQLError('Shift not found');
    }

    if (!instance) {
      throw new NotFoundGraphQLError('Shift instance not found');
    }

    if (shift.visibility !== ShiftVisibility.ALL_MEMBERS) {
      throw new ForbiddenGraphQLError(
        'This shift is invite-only and cannot be joined directly',
      );
    }

    const orgUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: shift.organizationUnitId },
    });

    if (!orgUnit) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    const isAllowed = await this.membershipService.isMemberOfUnitOrAncestor(
      userId,
      orgUnit.id,
    );

    if (!isAllowed) {
      const result = await this.membershipService.requestOrgJoin(
        userId,
        orgUnit.id,
        instanceId,
      );

      if (result.status === 'REQUIREMENTS_NEEDED') {
        return {
          status: JoinStatus.REQUIREMENTS_NEEDED,
          shiftInstance: instance,
          requirementProfile: result.requirementProfile,
          requirementStatuses: result.requirementStatuses,
          requiredForms: result.requiredForms,
        };
      }

      if (result.status === 'REJECTED') {
        return {
          status: JoinStatus.REJECTED,
          shiftInstance: instance,
          membershipRequest: result.membershipRequest,
        };
      }

      const shiftFormsCheck = await this.checkShiftRequiredForms(
        userId,
        shift.id,
      );
      if (!shiftFormsCheck.satisfied) {
        return {
          status: JoinStatus.REQUIREMENTS_NEEDED,
          shiftInstance: instance,
          requiredForms: shiftFormsCheck.requiredForms,
        };
      }

      if (result.status === 'PENDING') {
        return {
          status: JoinStatus.PENDING,
          shiftInstance: instance,
          membershipRequest: result.membershipRequest,
        };
      }

      await this.joinShiftInstance(
        userId,
        instanceId,
        ShiftInviteStatus.SELF_JOINED,
        undefined,
        true,
      );
      return {
        status: JoinStatus.JOINED,
        shiftInstance: instance,
      };
    }

    const shiftFormsCheck = await this.checkShiftRequiredForms(
      userId,
      shift.id,
    );
    if (!shiftFormsCheck.satisfied) {
      return {
        status: JoinStatus.REQUIREMENTS_NEEDED,
        shiftInstance: instance,
        requiredForms: shiftFormsCheck.requiredForms,
      };
    }

    await this.joinShiftInstance(
      userId,
      instanceId,
      ShiftInviteStatus.SELF_JOINED,
      undefined,
      true,
    );
    return {
      status: JoinStatus.JOINED,
      shiftInstance: instance,
    };
  }

  async updateShiftInviteStatus(
    userId: string,
    shiftId: string,
    status: ShiftInviteStatus,
  ): Promise<ShiftInviteEntity> {
    const shift = await this.db.query.shifts.findFirst({
      where: { id: shiftId, isDeleted: false },
    });

    if (!shift) {
      throw new NotFoundGraphQLError('Shift not found');
    }

    const invite = await this.db.query.shiftInvites.findFirst({
      where: { shiftId, userId },
    });

    if (!invite) {
      throw new NotFoundGraphQLError('Shift invite not found');
    }

    this.assertInviteStatusTransition(invite.status, status);

    if (invite.status === status) {
      return invite;
    }

    if (status === ShiftInviteStatus.ACCEPTED) {
      await this.assertShiftSeriesAcceptanceCapacity(shiftId, userId);
    }

    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(schema.shiftInvites)
        .set({ status })
        .where(eq(schema.shiftInvites.id, invite.id))
        .returning();

      await propagateShiftInviteStatusToFutureInstances(
        tx,
        shiftId,
        userId,
        status,
      );

      return updated;
    });
  }

  async updateShiftInstanceInviteStatus(
    userId: string,
    instanceId: string,
    status: ShiftInviteStatus,
  ): Promise<ShiftInstanceInviteEntity> {
    const instance = await this.db.query.shiftInstances.findFirst({
      where: { id: instanceId, isCancelled: false },
      with: { master: true },
    });

    if (!instance?.master || instance.master.isDeleted) {
      throw new NotFoundGraphQLError('Shift instance not found');
    }

    const invite = await this.db.query.shiftInstanceInvites.findFirst({
      where: { instanceId, userId },
    });

    if (!invite) {
      throw new NotFoundGraphQLError('Shift instance invite not found');
    }

    this.assertInviteStatusTransition(invite.status, status);

    if (invite.status === status) {
      return invite;
    }

    if (status === ShiftInviteStatus.ACCEPTED) {
      await this.assertShiftInstanceAcceptanceCapacity(instanceId);
    }

    const [updated] = await this.db
      .update(schema.shiftInstanceInvites)
      .set({ status })
      .where(eq(schema.shiftInstanceInvites.id, invite.id))
      .returning();

    if (status === ShiftInviteStatus.ACCEPTED) {
      void this.notifyShiftInstanceJoined(userId, instance.master, instance);
    }

    return updated;
  }

  private assertInviteStatusTransition(
    from: ShiftInviteStatus,
    to: ShiftInviteStatus,
  ): void {
    if (!canTransitionInviteStatus(from, to)) {
      throw new BadRequestGraphQLError(
        `Cannot transition invite status from ${from} to ${to}`,
      );
    }
  }

  private async assertShiftInstanceAcceptanceCapacity(
    instanceId: string,
    db: Database = this.db,
  ): Promise<void> {
    const instance = await db.query.shiftInstances.findFirst({
      where: { id: instanceId, isCancelled: false },
      with: { master: true },
    });

    if (!instance?.master) {
      throw new NotFoundGraphQLError('Shift instance not found');
    }

    const maxVolunteers =
      instance.overrideMaxVolunteers ?? instance.master.maxVolunteers;

    if (!maxVolunteers) {
      return;
    }

    const [capacity] = await db
      .select({ current: count() })
      .from(schema.shiftInstanceInvites)
      .where(
        and(
          inArray(schema.shiftInstanceInvites.status, [
            ...PARTICIPATING_SHIFT_INVITE_STATUSES,
          ]),
          eq(schema.shiftInstanceInvites.instanceId, instanceId),
        ),
      );

    if ((capacity?.current ?? 0) >= maxVolunteers) {
      throw new ConflictGraphQLError(
        `Cannot accept invite: instance is at full capacity of ${maxVolunteers}`,
      );
    }
  }

  private async assertShiftSeriesAcceptanceCapacity(
    shiftId: string,
    userId: string,
  ): Promise<void> {
    const now = new Date();

    const futureInstanceInvites =
      await this.db.query.shiftInstanceInvites.findMany({
        where: {
          userId,
          status: {
            notIn: [...PARTICIPATING_SHIFT_INVITE_STATUSES],
          },
          instance: {
            masterId: shiftId,
            isCancelled: false,
            actualStartsAt: { gte: now },
          },
        },
        columns: { instanceId: true },
      });

    for (const invite of futureInstanceInvites) {
      await this.assertShiftInstanceAcceptanceCapacity(invite.instanceId);
    }
  }

  private async resolveImageUrl(fileId: string): Promise<string> {
    await this.fileService.assertUploadedFileForPurpose(
      fileId,
      FilePurpose.SHIFT_IMAGE,
    );
    return this.fileService.resolvePublicUrlForUploadedFile(fileId);
  }

  private async setRequiredFormsInTx(
    tx: Database,
    shiftId: string,
    organizationUnitId: string,
    formIds: string[],
  ): Promise<void> {
    const orgUnit = await tx.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
    });

    if (!orgUnit) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    await this.requiredFormService.applyShiftRequiredForms(
      shiftId,
      orgUnit.organizationId,
      formIds,
      tx,
    );
  }

  private async getShiftRequiredFormStatuses(
    userId: string,
    shiftId: string,
  ): Promise<RequiredFormStatus[]> {
    return this.requiredFormService.getRequiredFormStatuses(userId, {
      targetType: RequiredFormTargetType.SHIFT,
      targetId: shiftId,
    });
  }

  private async checkShiftRequiredForms(
    userId: string,
    shiftId: string,
  ): Promise<{
    satisfied: boolean;
    requiredForms: RequiredFormStatus[];
  }> {
    const requiredForms = await this.getShiftRequiredFormStatuses(
      userId,
      shiftId,
    );
    const missingForms = requiredForms.filter((s) => !s.submitted);
    return { satisfied: missingForms.length === 0, requiredForms };
  }
}
