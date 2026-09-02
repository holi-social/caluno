import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, count, eq, gte, inArray, isNull, lt, ne, sql } from 'drizzle-orm';
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
import { MembershipRequestStatus } from '../membership/enums';
import { MembershipService } from '../membership/membership.service';
import type { MembershipRequestEntity } from '../membership/schemas/membership-request.schema';
import { NotificationService } from '../notification/notification.service';
import { buildShiftInviteSchedule } from '../notification/shift-invite-schedule';
import { OrganizationService } from '../organization/organization.service';
import { RequiredFormTargetType } from '../requirement-profile/enums';
import type { RequirementProfileEntity } from '../requirement-profile/schemas/requirement-profile.schema';
import { FormSubmissionService } from '../requirement-profile/services/form-submission.service';
import {
  RequiredFormService,
  type RequiredFormStatus,
} from '../requirement-profile/services/required-form.service';
import { JoinStatus } from '../shared/enums/join-status.enum';
import {
  ACTIVE_SHIFT_INVITE_STATUSES,
  ADMIN_UNINVITE_SOURCE_STATUSES,
  canTransitionInviteStatus,
  isParticipatingShiftInviteStatus,
  PARTICIPATING_SHIFT_INVITE_STATUSES,
} from '../shared/invite-status';
import {
  POSTHOG_EVENT,
  POSTHOG_JOIN_SOURCE,
  POSTHOG_SURFACE,
  type PostHogJoinSource,
} from '../shared/observability/posthog.events';
import { PostHogService } from '../shared/observability/posthog.service';
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
import { parseRruleDays, parseRruleUntil } from './utils/parse-rrule';
import { expandShift } from './utils/rrule-expander';
import { localDateKey, syncShiftInstances } from './utils/shift-instance-sync';

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
    private readonly formSubmissionService: FormSubmissionService,
    private readonly postHogService: PostHogService,
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
  ): Promise<ShiftInstanceEntity & { master: ShiftEntity }> {
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

  /** A single public (non-cancelled) upcoming instance by id, without fetching its shift's whole schedule. */
  async findPublicInstance(instanceId: string): Promise<ShiftInstanceEntity> {
    const instance = await this.db.query.shiftInstances.findFirst({
      where: {
        id: instanceId,
        isCancelled: false,
        actualStartsAt: { gte: startOfTodayInAppTimeZone() },
      },
      with: { master: true },
    });

    if (!instance) {
      throw new NotFoundGraphQLError(
        `Shift instance with ID ${instanceId} not found`,
      );
    }

    return instance;
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
      ) as Promise<{ shiftInstanceId: string }[]>;
  }

  /** A user's shift-instance invite statuses across many instances in one query (DataLoader batch). */
  async findInviteStatusesForUser(
    userId: string,
    instanceIds: string[],
  ): Promise<
    { shiftInstanceId: string; status: ShiftInviteStatus; createdAt: Date }[]
  > {
    if (instanceIds.length === 0) return [];

    const rows = await this.db
      .select({
        shiftInstanceId: schema.shiftInstanceInvites.instanceId,
        status: schema.shiftInstanceInvites.status,
        createdAt: schema.shiftInstanceInvites.createdAt,
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
      createdAt: row.createdAt,
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
    includeIntended = false,
  ): Promise<{ instances: ShiftInstanceEntity[]; total: number }> {
    const organizationUnitIds =
      await this.getAccessibleOrganizationUnitIds(userId);

    const dateCondition = this.buildMyShiftDateCondition(
      startsAfter,
      endsBefore,
      includePast,
    );

    if (!includeIntended) {
      if (organizationUnitIds.length === 0) {
        return EMPTY_SHIFT_INSTANCE_PAGE;
      }

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

    const [invitedPage, intendedPage] = await Promise.all([
      organizationUnitIds.length > 0
        ? this.findMyInvitedShiftInstances(
            userId,
            organizationUnitIds,
            dateCondition,
            statuses,
          )
        : EMPTY_SHIFT_INSTANCE_PAGE,
      this.findMyIntendedShiftInstances(userId, dateCondition),
    ]);

    return this.mergeShiftInstancePages(
      [invitedPage, intendedPage],
      order,
      limit,
      offset,
    );
  }

  private async findMyInvitedShiftInstances(
    userId: string,
    organizationUnitIds: string[],
    dateCondition: Record<string, unknown>,
    statuses: readonly ShiftInviteStatus[],
  ): Promise<{ instances: ShiftInstanceEntity[]; total: number }> {
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

    const [instances, totalResult] = await Promise.all([
      this.db.query.shiftInstances.findMany({
        where,
        with: { master: true },
      }),
      this.db.query.shiftInstances.findMany({
        where,
        columns: {},
        extras: { total: count() },
      }),
    ]);

    return { instances, total: totalResult[0]?.total ?? 0 };
  }

  async findIntendedInstanceIdsForUsers(
    userIdInstanceIdPairs: Array<{ userId: string; instanceId: string }>,
  ): Promise<Set<string>> {
    const userIds = Array.from(
      new Set(userIdInstanceIdPairs.map((pair) => pair.userId)),
    );

    if (userIds.length === 0) {
      return new Set();
    }

    const requests = await this.db.query.membershipRequests.findMany({
      where: {
        userId: { in: userIds },
        status: MembershipRequestStatus.PENDING,
      },
      columns: { userId: true, metadata: true },
    });

    const intendedIdsByUser = new Map<string, Set<string>>();
    for (const request of requests) {
      if (!request.userId) continue;
      const intendedIds =
        (request.metadata as { intendedShiftInstanceIds?: string[] } | null)
          ?.intendedShiftInstanceIds ?? [];
      intendedIdsByUser.set(request.userId, new Set(intendedIds));
    }

    const result = new Set<string>();
    for (const { userId, instanceId } of userIdInstanceIdPairs) {
      if (intendedIdsByUser.get(userId)?.has(instanceId)) {
        result.add(`${instanceId}:${userId}`);
      }
    }

    return result;
  }

  private async findMyIntendedShiftInstances(
    userId: string,
    dateCondition: Record<string, unknown>,
  ): Promise<{ instances: ShiftInstanceEntity[]; total: number }> {
    const requests = await this.db.query.membershipRequests.findMany({
      where: {
        userId,
        status: MembershipRequestStatus.PENDING,
      },
      columns: { metadata: true },
    });

    const intendedIds = requests.flatMap(
      (request) =>
        (request.metadata as { intendedShiftInstanceIds?: string[] } | null)
          ?.intendedShiftInstanceIds ?? [],
    );

    if (intendedIds.length === 0) {
      return EMPTY_SHIFT_INSTANCE_PAGE;
    }

    const instances = await this.db.query.shiftInstances.findMany({
      where: {
        id: { in: intendedIds },
        isCancelled: false,
        ...dateCondition,
        master: { isDeleted: false },
      },
      with: { master: true },
    });

    return { instances, total: instances.length };
  }

  private mergeShiftInstancePages(
    pages: Array<{ instances: ShiftInstanceEntity[]; total: number }>,
    order: SortOrder,
    limit: number,
    offset: number,
  ): { instances: ShiftInstanceEntity[]; total: number } {
    const seen = new Set<string>();
    const all: ShiftInstanceEntity[] = [];

    for (const page of pages) {
      for (const instance of page.instances) {
        if (seen.has(instance.id)) continue;
        seen.add(instance.id);
        all.push(instance);
      }
    }

    all.sort((a, b) => {
      const diff =
        new Date(a.actualStartsAt).getTime() -
        new Date(b.actualStartsAt).getTime();
      return order === SortOrder.DESC ? -diff : diff;
    });

    return {
      instances: all.slice(offset, offset + limit),
      total: all.length,
    };
  }

  private buildMyShiftDateCondition(
    startsAfter: Date | null,
    endsBefore: Date | null,
    includePast: boolean = true,
  ): Record<string, unknown> {
    const condition: Record<string, unknown> = {};
    if (startsAfter) {
      condition.actualStartsAt = { gte: startsAfter };
    }

    const actualEndsAt: { gte?: Date; lt?: Date } = {};
    if (!includePast) {
      actualEndsAt.gte = new Date();
    }
    if (endsBefore) {
      actualEndsAt.lt = endsBefore;
    }
    if (actualEndsAt.gte || actualEndsAt.lt) {
      condition.actualEndsAt = actualEndsAt;
    }

    return condition;
  }

  async findAvailableShiftInstances(
    userId: string,
    startsAfter: Date | null,
    endsBefore: Date | null,
    organizationUnitIds: string[] | null,
    limit: number,
    offset: number,
  ): Promise<{ instances: ShiftInstanceEntity[]; total: number }> {
    const [acceptedOrganizationUnitIds, pendingOrganizationUnitIds] =
      await Promise.all([
        this.getAccessibleOrganizationUnitIds(userId),
        this.membershipService.getPendingOrganizationUnitIds(userId),
      ]);

    const accessibleOrganizationUnitIds = [
      ...acceptedOrganizationUnitIds,
      ...pendingOrganizationUnitIds,
    ];

    if (accessibleOrganizationUnitIds.length === 0) {
      return EMPTY_SHIFT_INSTANCE_PAGE;
    }

    const requestedOrgUnitIds = organizationUnitIds?.length
      ? organizationUnitIds.filter((id) =>
          accessibleOrganizationUnitIds.includes(id),
        )
      : accessibleOrganizationUnitIds;

    if (requestedOrgUnitIds.length === 0) {
      return EMPTY_SHIFT_INSTANCE_PAGE;
    }

    const acceptedIds = requestedOrgUnitIds.filter((id) =>
      acceptedOrganizationUnitIds.includes(id),
    );
    const pendingIds = requestedOrgUnitIds.filter((id) =>
      pendingOrganizationUnitIds.includes(id),
    );

    const dateCondition = this.buildMyShiftDateCondition(
      startsAfter ?? this.getStartOfToday(),
      endsBefore,
    );

    const visibilityBranches: Record<string, unknown>[] = [];

    if (acceptedIds.length > 0) {
      visibilityBranches.push({
        master: { organizationUnitId: { in: acceptedIds } },
        OR: [
          { master: { visibility: ShiftVisibility.ALL_MEMBERS } },
          { invites: { userId, status: ShiftInviteStatus.INVITED } },
        ],
      });
    }

    if (pendingIds.length > 0) {
      visibilityBranches.push({
        master: {
          organizationUnitId: { in: pendingIds },
          visibility: ShiftVisibility.ALL_MEMBERS,
        },
      });
    }

    const where = {
      isCancelled: false,
      ...dateCondition,
      master: { isDeleted: false },
      NOT: {
        invites: {
          userId,
          status: { in: [...PARTICIPATING_SHIFT_INVITE_STATUSES] },
        },
      },
      OR: visibilityBranches,
    };

    const [instances, totalResult] = await Promise.all([
      this.db.query.shiftInstances.findMany({
        where,
        with: { master: true },
        // Tie-break on id so instances sharing the same actualStartsAt keep a
        // stable order across pages instead of an arbitrary DB-chosen order.
        orderBy: { actualStartsAt: 'asc', id: 'asc' },
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
          reimbursementTypeId: shiftInput.reimbursementTypeId ?? null,
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

    this.postHogService.capture({
      event: POSTHOG_EVENT.SHIFT_CREATE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: await this.resolveOrganizationId(organizationUnitId),
        organization_unit_id: organizationUnitId,
        shift_id: shift.id,
      },
    });

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
            status: true;
          };
        };
        master: true;
      }
    >,
    memberIds: string[],
    inviteStatus: ShiftInviteStatus = ShiftInviteStatus.INVITED,
    actorUserId?: string,
  ): Promise<void> {
    if (memberIds.length === 0) {
      return;
    }
    const maxVolunteers =
      shiftInstance.overrideMaxVolunteers ?? shiftInstance.master.maxVolunteers;

    // Only active (pending or participating) invites occupy capacity —
    // REJECTED/CANCELLED rows must not block re-invites. Stale rows for the
    // members being (re)added are still represented by memberIds.length here,
    // since they resurrect to active below.
    const activeInviteCount = shiftInstance.invites.filter((inv) =>
      ACTIVE_SHIFT_INVITE_STATUSES.includes(inv.status),
    ).length;

    if (maxVolunteers && activeInviteCount + memberIds.length > maxVolunteers) {
      throw new ConflictGraphQLError(
        `Cannot invite members: instance would exceed capacity of ${maxVolunteers}`,
      );
    }

    // Inviting yourself happens silently: written straight to ACCEPTED with
    // no pending state, since there's nothing for the actor to accept.
    // Notifications for this batch are emitted by the caller after commit.
    const members = memberIds.map((userId) => ({
      userId,
      status:
        actorUserId != null && userId === actorUserId
          ? ShiftInviteStatus.ACCEPTED
          : inviteStatus,
    }));

    await this.createInvitesForInstances(tx, [shiftInstance.id], members);
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
      skipCapture?: boolean;
    } = {},
    actorUserId?: string,
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
    const currentInstanceInviteUserIds = currentShiftInstance.invites
      .filter((inv) => ACTIVE_SHIFT_INVITE_STATUSES.includes(inv.status))
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
            actorUserId,
          );
          // Resurrect pre-existing inactive (REJECTED/CANCELLED) invite rows —
          // the insert above no-ops on conflict for those. The actor adding
          // themselves resurrects straight to ACCEPTED, same as a fresh insert.
          const selfIdsToAdd = actorUserId
            ? userIdsToAdd.filter((id) => id === actorUserId)
            : [];
          const otherIdsToAdd = actorUserId
            ? userIdsToAdd.filter((id) => id !== actorUserId)
            : userIdsToAdd;
          if (otherIdsToAdd.length > 0) {
            await tx
              .update(schema.shiftInstanceInvites)
              .set({ status: inviteStatus })
              .where(
                and(
                  eq(schema.shiftInstanceInvites.instanceId, shiftInstanceId),
                  inArray(schema.shiftInstanceInvites.userId, otherIdsToAdd),
                ),
              );
          }
          if (selfIdsToAdd.length > 0) {
            await tx
              .update(schema.shiftInstanceInvites)
              .set({ status: ShiftInviteStatus.ACCEPTED })
              .where(
                and(
                  eq(schema.shiftInstanceInvites.instanceId, shiftInstanceId),
                  inArray(schema.shiftInstanceInvites.userId, selfIdsToAdd),
                ),
              );
          }
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
              .filter((invite) =>
                ACTIVE_SHIFT_INVITE_STATUSES.includes(invite.status),
              )
              .map((invite) => invite.userId),
          );
          const membersToAdd = userIdsToAdd.filter(
            (id) => !invitedUserIds.has(id),
          );
          // Only active invites occupy capacity — REJECTED/CANCELLED rows
          // must not block re-invites on future instances.
          const activeInviteCount = instance.invites.filter((invite) =>
            ACTIVE_SHIFT_INVITE_STATUSES.includes(invite.status),
          ).length;
          if (capacity && membersToAdd.length + activeInviteCount > capacity) {
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
        const notifyUserIds = actorUserId
          ? userIdsToAdd.filter((id) => id !== actorUserId)
          : userIdsToAdd;
        void this.loadAndEmitShiftInstanceInvitedNotification(
          currentShiftInstance.master,
          currentShiftInstance,
          notifyUserIds,
        );
      } else {
        void this.loadAndEmitShiftInvitedNotification(
          currentShiftInstance.master,
          userIdsToAdd,
        );
      }

      if (!options.skipCapture) {
        const organizationId = await this.resolveOrganizationId(
          currentShiftInstance.master.organizationUnitId,
        );
        for (const invitedUserId of userIdsToAdd) {
          this.postHogService.capture({
            event: POSTHOG_EVENT.SHIFT_INSTANCE_INVITE,
            userId: invitedUserId,
            properties: {
              surface: POSTHOG_SURFACE.BACKOFFICE,
              organization_id: organizationId,
              organization_unit_id:
                currentShiftInstance.master.organizationUnitId,
              shift_id: currentShiftInstance.master.id,
              shift_instance_id: shiftInstanceId,
              invite_to_all_instances: Boolean(options.inviteToAllInstances),
            },
          });
        }
      }
    }

    return currentShiftInstance;
  }

  async updateShiftInstance(
    instanceId: string,
    input: UpdateShiftInstanceInput,
    organizationUnitId: string,
    options: { applyToAllFuture?: boolean; actorUserId?: string } = {},
  ): Promise<ShiftInstanceEntity> {
    const instance = await this.db.transaction(async (tx) => {
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

      if (options.applyToAllFuture || instance.master.rrule === null) {
        return this.updateShiftInstanceSeries(
          tx,
          instance,
          input,
          organizationUnitId,
          options.applyToAllFuture ?? false,
        );
      } else {
        return this.updateSingleShiftInstance(tx, instance, input);
      }
    });

    if (options.actorUserId) {
      this.postHogService.capture({
        event: POSTHOG_EVENT.SHIFT_INSTANCE_UPDATE,
        userId: options.actorUserId,
        properties: {
          surface: POSTHOG_SURFACE.BACKOFFICE,
          organization_id: await this.resolveOrganizationId(organizationUnitId),
          organization_unit_id: organizationUnitId,
          shift_id: instance.masterId,
          shift_instance_id: instance.id,
          apply_to_all_future: options.applyToAllFuture ?? false,
        },
      });
    }

    return instance;
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
        throw new ConflictGraphQLError('shift_instance_time_conflict');
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
        overrideReimbursementTypeId: input.reimbursementTypeId ?? null,
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

    if (input.requiredFormIds !== undefined) {
      const orgUnit = await tx.query.organizationUnits.findFirst({
        where: { id: instance.master.organizationUnitId },
      });

      if (orgUnit) {
        await this.requiredFormService.applyShiftInstanceRequiredForms(
          instance.id,
          orgUnit.organizationId,
          input.requiredFormIds ?? [],
          tx,
        );
      }
    }

    return updated;
  }

  private async updateShiftInstanceSeries(
    tx: Database,
    instance: ShiftInstanceEntity & { master: ShiftEntity },
    input: UpdateShiftInstanceInput,
    organizationUnitId: string,
    applyToAllFuture: boolean,
  ): Promise<ShiftInstanceEntity> {
    const shift = instance.master;
    const fromDate = new Date(instance.actualStartsAt);
    fromDate.setHours(0, 0, 0, 0);

    if (
      input.startsAt.getFullYear() !== instance.actualStartsAt.getFullYear() ||
      input.startsAt.getMonth() !== instance.actualStartsAt.getMonth() ||
      input.startsAt.getDate() !== instance.actualStartsAt.getDate()
    ) {
      throw new ConflictGraphQLError('shift_instance_date_mismatch');
    }

    const durationMinutes = getDurationMinutes(input.startsAt, input.endsAt);
    const newOriginalStartsAt = this.applyTimeOfDay(
      shift.originalStartsAt,
      input.startsAt,
    );

    // `input.rrule` is `null` when the user explicitly cleared recurrence,
    // `undefined` when recurrence wasn't touched by this edit — `??` would
    // treat both the same, silently discarding an explicit clear.
    if (input.rrule === null && shift.rrule !== null) {
      throw new ConflictGraphQLError(
        'shift_instance_clear_recurrence_unsupported',
      );
    }
    const newRrule = input.rrule === undefined ? shift.rrule : input.rrule;

    // Compare the recurrence PATTERN (weekdays + end date), not the raw
    // rrule string. The frontend's generateRrule() bakes a DTSTART tied to
    // the edited occurrence's own date, which essentially never matches the
    // series' stored anchor — a raw string compare is a false positive on
    // nearly every save, which silently strands the safe time-only path
    // below and routes every edit through the heavier resync path instead.
    const recurrenceChanged = !this.rrulePatternsEqual(shift.rrule, newRrule);

    const imageUrl =
      input.imageFileId === undefined
        ? undefined
        : input.imageFileId
          ? await this.resolveImageUrl(input.imageFileId)
          : null;

    const [updatedShift] = await tx
      .update(schema.shifts)
      .set({
        title: input.title,
        slug: slugify(input.title),
        location: input.location ?? null,
        instructions: input.instructions ?? null,
        minVolunteers: input.minVolunteers ?? null,
        maxVolunteers: input.maxVolunteers ?? null,
        ...(input.visibility ? { visibility: input.visibility } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        rrule: newRrule,
        originalStartsAt: newOriginalStartsAt,
        durationMinutes,
      })
      .where(
        and(
          eq(schema.shifts.id, shift.id),
          eq(schema.shifts.organizationUnitId, organizationUnitId),
        ),
      )
      .returning();

    if (!updatedShift) {
      throw new NotFoundGraphQLError(`Shift with ID ${shift.id} not found`);
    }

    if (input.requiredFormIds !== undefined) {
      // This method is only reached with applyToAllFuture === false when
      // there's no series to fork from (rrule === null): the instance IS
      // the shift, so required forms must land on the master here too —
      // matching how image/title/location etc. already sync in that case.
      await this.setRequiredFormsInTx(
        tx,
        shift.id,
        organizationUnitId,
        input.requiredFormIds ?? [],
      );
    }

    // Mirrors ShiftService.update()'s existing behavior: dropping visibility
    // to invited-only clears standing invites, since "everyone" no longer
    // applies. Scoped to fromDate onward, matching this method's contract.
    if (
      input.visibility &&
      shift.visibility === ShiftVisibility.ALL_MEMBERS &&
      input.visibility === ShiftVisibility.INVITED_MEMBERS
    ) {
      const futureInstances = await tx.query.shiftInstances.findMany({
        where: { masterId: shift.id, actualStartsAt: { gte: fromDate } },
        columns: { id: true },
      });
      const futureInstanceIds = futureInstances.map((i) => i.id);
      if (futureInstanceIds.length > 0) {
        await tx
          .delete(schema.shiftInstanceInvites)
          .where(
            inArray(schema.shiftInstanceInvites.instanceId, futureInstanceIds),
          );
      }
    }

    if (recurrenceChanged) {
      const target = expandShift(
        updatedShift.rrule,
        updatedShift.originalStartsAt,
        updatedShift.durationMinutes,
      );

      const editedDateKey = localDateKey(instance.actualStartsAt);
      const editedOccurrenceSurvives = target.some(
        (t) => localDateKey(t.actualStartsAt) === editedDateKey,
      );
      if (!editedOccurrenceSurvives) {
        throw new ConflictGraphQLError('shift_instance_recurrence_conflict');
      }

      await syncShiftInstances(tx, shift.id, target, { fromDate });

      // syncShiftInstances only rewrites rows whose date/duration actually
      // changed — rows that already matched the new pattern are left alone,
      // so they'd otherwise keep stale per-occurrence overrides. Sweep them
      // separately; the time-rewrite branch below does this as part of its
      // own UPDATE instead.
      await tx
        .update(schema.shiftInstances)
        .set({
          overrideTitle: null,
          overrideLocation: null,
          overrideInstructions: null,
          overrideMinVolunteers: null,
          overrideMaxVolunteers: null,
          overrideReimbursementTypeId: input.reimbursementTypeId ?? null,
          isException: false,
        })
        .where(
          and(
            eq(schema.shiftInstances.masterId, shift.id),
            gte(schema.shiftInstances.actualStartsAt, fromDate),
            eq(schema.shiftInstances.isCancelled, false),
          ),
        );
    } else {
      const startTime = this.toTimeOfDayString(input.startsAt);
      const endTime = this.toTimeOfDayString(input.endsAt);

      await tx
        .update(schema.shiftInstances)
        .set({
          overrideTitle: null,
          overrideLocation: null,
          overrideInstructions: null,
          overrideMinVolunteers: null,
          overrideMaxVolunteers: null,
          overrideReimbursementTypeId: input.reimbursementTypeId ?? null,
          isException: false,
          actualStartsAt: sql`date_trunc('day', ${schema.shiftInstances.actualStartsAt}) + ${startTime}::interval`,
          actualEndsAt: sql`date_trunc('day', ${schema.shiftInstances.actualStartsAt}) + ${endTime}::interval`,
        })
        .where(
          and(
            eq(schema.shiftInstances.masterId, shift.id),
            gte(schema.shiftInstances.actualStartsAt, fromDate),
            eq(schema.shiftInstances.isCancelled, false),
          ),
        );
    }

    const [refreshedInstance] = await tx
      .select()
      .from(schema.shiftInstances)
      .where(eq(schema.shiftInstances.id, instance.id));

    if (!refreshedInstance) {
      throw new NotFoundGraphQLError(
        `Shift instance with ID ${instance.id} not found`,
      );
    }

    return refreshedInstance;
  }

  private rrulePatternsEqual(a: string | null, b: string | null): boolean {
    const daysA = new Set(parseRruleDays(a));
    const daysB = new Set(parseRruleDays(b));
    if (daysA.size !== daysB.size) return false;
    for (const day of daysA) {
      if (!daysB.has(day)) return false;
    }
    const untilA = parseRruleUntil(a)?.getTime() ?? null;
    const untilB = parseRruleUntil(b)?.getTime() ?? null;
    return untilA === untilB;
  }

  /**
   * Keeps `base`'s calendar date, adopts `time`'s hour/minute/second.
   *
   * Uses UTC getters/setters, not local ones: Drizzle stores/reads these
   * naive `timestamp` columns via `Date.toISOString()` (UTC digits — Postgres
   * ignores any offset on a tz-less column), so `base`/`time`'s UTC digits
   * are what the DB actually holds. Local getters/setters would read/write
   * the host process's OS timezone instead, drifting by that offset.
   */
  private applyTimeOfDay(base: Date, time: Date): Date {
    const result = new Date(base);
    result.setUTCHours(
      time.getUTCHours(),
      time.getUTCMinutes(),
      time.getUTCSeconds(),
      0,
    );
    return result;
  }

  /** See `applyTimeOfDay` for why this uses UTC getters. */
  private toTimeOfDayString(date: Date): string {
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
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

  async deleteShiftInstance(
    id: string,
    organizationUnitId: string,
    options: { applyToAllFuture?: boolean; actorUserId?: string } = {},
  ): Promise<ShiftInstanceEntity> {
    const { shift, cancelledInstance, recipientUserIds, fromDate } =
      await this.db.transaction(async (tx) => {
        const instance = await tx.query.shiftInstances.findFirst({
          where: { id },
          with: { master: true },
        });

        if (
          !instance ||
          instance.master.organizationUnitId !== organizationUnitId
        ) {
          throw new NotFoundGraphQLError(
            `Shift instance with ID ${id} not found`,
          );
        }

        if (instance.actualEndsAt.getTime() < Date.now()) {
          throw new ConflictGraphQLError(
            'Cannot delete a past or completed shift instance',
          );
        }

        if (!options.applyToAllFuture) {
          if (await this.hasOpenTimeEntryForInstances([id], tx)) {
            throw new ConflictGraphQLError(
              'Cannot delete a shift instance with an open time entry',
            );
          }

          const [cancelledInstance] = await tx
            .update(schema.shiftInstances)
            .set({ isCancelled: true })
            .where(
              and(
                eq(schema.shiftInstances.id, id),
                eq(schema.shiftInstances.isCancelled, false),
              ),
            )
            .returning();

          if (!cancelledInstance) {
            throw new ConflictGraphQLError(
              `Shift instance with ID ${id} is already cancelled`,
            );
          }

          const recipientUserIds = await this.cancelActiveInvitesForInstances(
            tx,
            [id],
          );

          return {
            shift: instance.master,
            cancelledInstance,
            recipientUserIds,
            fromDate: null as Date | null,
          };
        }

        const fromDate = new Date(instance.actualStartsAt);
        fromDate.setHours(0, 0, 0, 0);
        const now = new Date();

        const targets = await tx.query.shiftInstances.findMany({
          where: {
            masterId: instance.masterId,
            actualStartsAt: { gte: fromDate },
            actualEndsAt: { gte: now },
            isCancelled: false,
          },
          columns: { id: true },
        });
        const targetIds = targets.map((target) => target.id);

        if (await this.hasOpenTimeEntryForInstances(targetIds, tx)) {
          throw new ConflictGraphQLError(
            'Cannot delete a shift instance with an open time entry',
          );
        }

        const [cancelledInstance] = await tx
          .update(schema.shiftInstances)
          .set({ isCancelled: true })
          .where(
            and(
              eq(schema.shiftInstances.id, id),
              eq(schema.shiftInstances.isCancelled, false),
            ),
          )
          .returning();

        if (!cancelledInstance) {
          throw new ConflictGraphQLError(
            `Shift instance with ID ${id} is already cancelled`,
          );
        }

        const restIds = targetIds.filter((targetId) => targetId !== id);
        let updatedRestIds: string[] = [];
        if (restIds.length > 0) {
          const updatedRest = await tx
            .update(schema.shiftInstances)
            .set({ isCancelled: true })
            .where(
              and(
                inArray(schema.shiftInstances.id, restIds),
                eq(schema.shiftInstances.isCancelled, false),
              ),
            )
            .returning({ id: schema.shiftInstances.id });
          updatedRestIds = updatedRest.map((row) => row.id);
        }

        const recipientUserIds = await this.cancelActiveInvitesForInstances(
          tx,
          [id, ...updatedRestIds],
        );

        return {
          shift: instance.master,
          cancelledInstance,
          recipientUserIds,
          fromDate,
        };
      });

    if (options.applyToAllFuture) {
      void this.loadAndEmitShiftInstanceSeriesCancelledNotification(
        shift,
        fromDate as Date,
        recipientUserIds,
      );
    } else {
      void this.loadAndEmitShiftInstanceCancelledNotification(
        shift,
        cancelledInstance,
        recipientUserIds,
      );
    }

    if (options.actorUserId) {
      this.postHogService.capture({
        event: POSTHOG_EVENT.SHIFT_INSTANCE_CANCEL,
        userId: options.actorUserId,
        properties: {
          surface: POSTHOG_SURFACE.BACKOFFICE,
          organization_id: await this.resolveOrganizationId(organizationUnitId),
          organization_unit_id: organizationUnitId,
          shift_id: shift.id,
          shift_instance_id: cancelledInstance.id,
          apply_to_all_future: Boolean(options.applyToAllFuture),
        },
      });
    }

    return cancelledInstance;
  }

  private async cancelActiveInvitesForInstances(
    tx: Database,
    instanceIds: string[],
  ): Promise<string[]> {
    if (instanceIds.length === 0) {
      return [];
    }

    const activeInvites = await tx.query.shiftInstanceInvites.findMany({
      where: {
        instanceId: { in: instanceIds },
        status: { in: [...ACTIVE_SHIFT_INVITE_STATUSES] },
      },
      columns: { userId: true },
    });

    if (activeInvites.length > 0) {
      await tx
        .update(schema.shiftInstanceInvites)
        .set({ status: ShiftInviteStatus.CANCELLED })
        .where(
          and(
            inArray(schema.shiftInstanceInvites.instanceId, instanceIds),
            inArray(schema.shiftInstanceInvites.status, [
              ...ACTIVE_SHIFT_INVITE_STATUSES,
            ]),
          ),
        );
    }

    return [...new Set(activeInvites.map((invite) => invite.userId))];
  }

  private async hasOpenTimeEntryForInstances(
    instanceIds: string[],
    executor: Database = this.db,
  ): Promise<boolean> {
    if (instanceIds.length === 0) {
      return false;
    }

    const [entry] = await executor
      .select({ id: schema.timeEntries.id })
      .from(schema.timeEntries)
      .where(
        and(
          inArray(schema.timeEntries.shiftInstanceId, instanceIds),
          isNull(schema.timeEntries.endedAt),
        ),
      )
      .limit(1);

    return entry !== undefined;
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

    const shift = await this.db.transaction(async (tx) => {
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

      const typeChanged =
        shiftInput.reimbursementTypeId !== undefined &&
        shiftInput.reimbursementTypeId !== shift.reimbursementTypeId;

      if (typeChanged && shift.reimbursementTypeId) {
        await tx
          .update(schema.shiftInstances)
          .set({ overrideReimbursementTypeId: shift.reimbursementTypeId })
          .where(
            and(
              eq(schema.shiftInstances.masterId, id),
              isNull(schema.shiftInstances.overrideReimbursementTypeId),
              lt(schema.shiftInstances.actualEndsAt, new Date()),
            ),
          );
      }

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

    this.postHogService.capture({
      event: POSTHOG_EVENT.SHIFT_UPDATE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: await this.resolveOrganizationId(organizationUnitId),
        organization_unit_id: organizationUnitId,
        shift_id: shift.id,
      },
    });

    return shift;
  }

  async delete(
    id: string,
    organizationUnitId: string,
    actorUserId?: string,
  ): Promise<ShiftEntity> {
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

    if (actorUserId) {
      this.postHogService.capture({
        event: POSTHOG_EVENT.SHIFT_DELETE,
        userId: actorUserId,
        properties: {
          surface: POSTHOG_SURFACE.BACKOFFICE,
          organization_id: await this.resolveOrganizationId(organizationUnitId),
          organization_unit_id: organizationUnitId,
          shift_id: shift.id,
        },
      });
    }

    return shift;
  }

  async findActiveShiftInstances(
    organizationUnitId: string,
  ): Promise<ShiftInstanceEntity[]> {
    const now = new Date();
    const windowMs = 12 * 60 * 60 * 1000;
    const windowStart = new Date(now.getTime() - windowMs);
    const windowEnd = new Date(now.getTime() + windowMs);

    const instances = await this.db.query.shiftInstances.findMany({
      where: {
        actualStartsAt: { lt: windowEnd },
        actualEndsAt: { gt: windowStart },
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
    startsAfter: Date | null,
    endsBefore: Date | null,
    eventId?: string | null,
  ): Promise<ShiftInstanceEntity[]> {
    const shifts = await this.db.query.shifts.findMany({
      where: {
        organizationUnitId,
        isDeleted: false,
        ...(eventId ? { eventId } : {}),
      },
      columns: { id: true },
    });
    const shiftIds = shifts.map((s) => s.id);
    if (shiftIds.length === 0) return [];

    const dateCondition = this.buildMyShiftDateCondition(
      startsAfter,
      endsBefore,
    );

    return this.db.query.shiftInstances.findMany({
      where: {
        masterId: { in: shiftIds },
        ...dateCondition,
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

  private async loadAndEmitShiftInstanceCancelledNotification(
    shift: ShiftEntity,
    instance: ShiftInstanceEntity,
    recipientUserIds: string[],
  ): Promise<void> {
    if (recipientUserIds.length === 0) {
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

      this.notificationService.notifyShiftInstanceCancelled({
        organizationUnitId: organizationUnit.id,
        organizationUnitName: organizationUnit.name,
        shiftId: shift.id,
        shiftTitle: shift.title,
        shiftLocation: shift.location,
        recipientUserIds,
        startsAt: instance.actualStartsAt,
        endsAt: instance.actualEndsAt,
        instanceId: instance.id,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit shift instance cancelled notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async loadAndEmitShiftInstanceSeriesCancelledNotification(
    shift: ShiftEntity,
    fromDate: Date,
    recipientUserIds: string[],
  ): Promise<void> {
    if (recipientUserIds.length === 0) {
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

      this.notificationService.notifyShiftInstanceSeriesCancelled({
        organizationUnitId: organizationUnit.id,
        organizationUnitName: organizationUnit.name,
        shiftId: shift.id,
        shiftTitle: shift.title,
        shiftLocation: shift.location,
        recipientUserIds,
        fromDate,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit shift instance series cancelled notification: ${error instanceof Error ? error.message : String(error)}`,
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
    options: {
      status?: ShiftInviteStatus;
      tx?: Database;
      formsAlreadySatisfied?: boolean;
      source?: PostHogJoinSource;
    } = {},
  ): Promise<void> {
    const {
      status = ShiftInviteStatus.ACCEPTED,
      tx,
      formsAlreadySatisfied,
      source = POSTHOG_JOIN_SOURCE.SELF_JOIN,
    } = options;
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
      await this.formSubmissionService.shareSubmissionsWithOrgUnit(userId, {
        targetType: RequiredFormTargetType.SHIFT,
        targetId: shift.id,
      });
      await this.formSubmissionService.shareSubmissionsWithOrgUnit(userId, {
        targetType: RequiredFormTargetType.SHIFT_INSTANCE,
        targetId: instanceId,
      });
      const formsCheck = await this.checkShiftAndInstanceRequiredForms(
        userId,
        shift.id,
        instanceId,
      );
      if (!formsCheck.satisfied) {
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
        await this.captureShiftInstanceJoin({
          userId,
          organizationUnitId: shift.organizationUnitId,
          shiftId: shift.id,
          shiftInstanceId: instanceId,
          source,
        });
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

    const [inserted] = await db
      .insert(schema.shiftInstanceInvites)
      .values({
        instanceId,
        userId,
        status,
      })
      .onConflictDoNothing()
      .returning();

    if (!inserted) {
      return;
    }

    void this.notifyShiftInstanceJoined(userId, shift, instance);
    await this.captureShiftInstanceJoin({
      userId,
      organizationUnitId: shift.organizationUnitId,
      shiftId: shift.id,
      shiftInstanceId: instanceId,
      source,
    });
  }

  async joinShift(
    userId: string,
    shiftId: string,
    source: PostHogJoinSource = POSTHOG_JOIN_SOURCE.SELF_JOIN,
  ): Promise<ShiftEntity> {
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
        columns: { userId: true, status: true },
      });
      const alreadyParticipating = existingShiftInvites.some(
        (invite) =>
          invite.userId === userId &&
          isParticipatingShiftInviteStatus(invite.status),
      );
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
          skipCapture: true,
        },
      );

      if (!alreadyParticipating) {
        this.postHogService.capture({
          event: POSTHOG_EVENT.SHIFT_JOIN,
          userId,
          properties: {
            surface:
              source === POSTHOG_JOIN_SOURCE.MEMBERSHIP_APPROVE
                ? POSTHOG_SURFACE.BACKOFFICE
                : POSTHOG_SURFACE.VOLUNTEERING,
            organization_id: await this.resolveOrganizationId(
              shift.organizationUnitId,
            ),
            organization_unit_id: shift.organizationUnitId,
            source,
            shift_id: shift.id,
          },
        });
      }
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
        const targetFormsCheck = await this.checkShiftAndInstanceRequiredForms(
          userId,
          shift.id,
          instanceId,
        );
        return {
          status: JoinStatus.REQUIREMENTS_NEEDED,
          shiftInstance: instance,
          requirementProfile: result.requirementProfile,
          requirementStatuses: result.requirementStatuses,
          requiredForms: [
            ...(result.requiredForms ?? []),
            ...targetFormsCheck.requiredForms,
          ],
        };
      }

      if (result.status === 'REJECTED') {
        return {
          status: JoinStatus.REJECTED,
          shiftInstance: instance,
          membershipRequest: result.membershipRequest,
        };
      }
      await this.formSubmissionService.shareSubmissionsWithOrgUnit(userId, {
        targetType: RequiredFormTargetType.SHIFT,
        targetId: shift.id,
      });
      await this.formSubmissionService.shareSubmissionsWithOrgUnit(userId, {
        targetType: RequiredFormTargetType.SHIFT_INSTANCE,
        targetId: instanceId,
      });
      const targetFormsCheck = await this.checkShiftAndInstanceRequiredForms(
        userId,
        shift.id,
        instanceId,
      );
      if (!targetFormsCheck.satisfied) {
        return {
          status: JoinStatus.REQUIREMENTS_NEEDED,
          shiftInstance: instance,
          requiredForms: targetFormsCheck.requiredForms,
        };
      }

      if (result.status === 'PENDING') {
        return {
          status: JoinStatus.PENDING,
          shiftInstance: instance,
          membershipRequest: result.membershipRequest,
        };
      }

      await this.joinShiftInstance(userId, instanceId, {
        status: ShiftInviteStatus.SELF_JOINED,
        formsAlreadySatisfied: true,
      });
      return {
        status: JoinStatus.JOINED,
        shiftInstance: instance,
      };
    }
    await this.formSubmissionService.shareSubmissionsWithOrgUnit(userId, {
      targetType: RequiredFormTargetType.SHIFT,
      targetId: shift.id,
    });
    await this.formSubmissionService.shareSubmissionsWithOrgUnit(userId, {
      targetType: RequiredFormTargetType.SHIFT_INSTANCE,
      targetId: instanceId,
    });
    const targetFormsCheck = await this.checkShiftAndInstanceRequiredForms(
      userId,
      shift.id,
      instanceId,
    );
    if (!targetFormsCheck.satisfied) {
      return {
        status: JoinStatus.REQUIREMENTS_NEEDED,
        shiftInstance: instance,
        requiredForms: targetFormsCheck.requiredForms,
      };
    }

    await this.joinShiftInstance(userId, instanceId, {
      status: ShiftInviteStatus.SELF_JOINED,
      formsAlreadySatisfied: true,
    });
    return {
      status: JoinStatus.JOINED,
      shiftInstance: instance,
    };
  }

  async updateShiftInviteStatus(
    userId: string,
    shiftId: string,
    status: ShiftInviteStatus,
    actorUserId: string = userId,
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

    const updated = await this.db.transaction(async (tx) => {
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

    const source = actorUserId === userId ? 'self' : 'admin';
    const organizationId = await this.resolveOrganizationId(
      shift.organizationUnitId,
    );
    this.postHogService.capture({
      event: POSTHOG_EVENT.SHIFT_INVITE_UPDATE,
      userId,
      properties: {
        surface:
          source === 'admin'
            ? POSTHOG_SURFACE.BACKOFFICE
            : POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: organizationId,
        organization_unit_id: shift.organizationUnitId,
        source,
        shift_id: shiftId,
        invite_status: status,
      },
    });
    if (
      status === ShiftInviteStatus.ACCEPTED ||
      status === ShiftInviteStatus.SELF_JOINED
    ) {
      this.postHogService.capture({
        event: POSTHOG_EVENT.SHIFT_JOIN,
        userId,
        properties: {
          surface:
            source === 'admin'
              ? POSTHOG_SURFACE.BACKOFFICE
              : POSTHOG_SURFACE.VOLUNTEERING,
          organization_id: organizationId,
          organization_unit_id: shift.organizationUnitId,
          source: POSTHOG_JOIN_SOURCE.INVITE_ACCEPT,
          shift_id: shiftId,
        },
      });
    }

    return updated;
  }

  async adminRejectInvitesForEventUser(
    eventId: string,
    userId: string,
    db: Database = this.db,
  ): Promise<void> {
    const shifts = await db.query.shifts.findMany({
      where: { eventId, isDeleted: false },
      columns: { id: true },
    });
    if (shifts.length === 0) {
      return;
    }

    const shiftIds = shifts.map((shift) => shift.id);
    const uninviteStatuses: ShiftInviteStatus[] = [
      ...ADMIN_UNINVITE_SOURCE_STATUSES,
    ];

    await db
      .update(schema.shiftInvites)
      .set({ status: ShiftInviteStatus.ADMIN_REJECTED })
      .where(
        and(
          eq(schema.shiftInvites.userId, userId),
          inArray(schema.shiftInvites.shiftId, shiftIds),
          inArray(schema.shiftInvites.status, uninviteStatuses),
        ),
      );

    const instances = await db.query.shiftInstances.findMany({
      where: {
        masterId: { in: shiftIds },
        isCancelled: false,
      },
      columns: { id: true },
    });
    if (instances.length === 0) {
      return;
    }

    const instanceIds = instances.map((instance) => instance.id);
    await db
      .update(schema.shiftInstanceInvites)
      .set({ status: ShiftInviteStatus.ADMIN_REJECTED })
      .where(
        and(
          eq(schema.shiftInstanceInvites.userId, userId),
          inArray(schema.shiftInstanceInvites.instanceId, instanceIds),
          inArray(schema.shiftInstanceInvites.status, uninviteStatuses),
        ),
      );
  }

  /**
   * Reverses adminRejectInvitesForEventUser: restores this user's
   * ADMIN_REJECTED invites on the event's shifts (and shift instances) back
   * to INVITED when an admin re-invites them to the event.
   */
  async adminReinviteInvitesForEventUser(
    eventId: string,
    userId: string,
    db: Database = this.db,
  ): Promise<void> {
    const shifts = await db.query.shifts.findMany({
      where: { eventId, isDeleted: false },
      columns: { id: true },
    });
    if (shifts.length === 0) {
      return;
    }

    const shiftIds = shifts.map((shift) => shift.id);

    await db
      .update(schema.shiftInvites)
      .set({ status: ShiftInviteStatus.INVITED })
      .where(
        and(
          eq(schema.shiftInvites.userId, userId),
          inArray(schema.shiftInvites.shiftId, shiftIds),
          eq(schema.shiftInvites.status, ShiftInviteStatus.ADMIN_REJECTED),
        ),
      );

    const instances = await db.query.shiftInstances.findMany({
      where: {
        masterId: { in: shiftIds },
        isCancelled: false,
      },
      columns: { id: true },
    });
    if (instances.length === 0) {
      return;
    }

    const instanceIds = instances.map((instance) => instance.id);
    await db
      .update(schema.shiftInstanceInvites)
      .set({ status: ShiftInviteStatus.INVITED })
      .where(
        and(
          eq(schema.shiftInstanceInvites.userId, userId),
          inArray(schema.shiftInstanceInvites.instanceId, instanceIds),
          eq(
            schema.shiftInstanceInvites.status,
            ShiftInviteStatus.ADMIN_REJECTED,
          ),
        ),
      );
  }

  async updateShiftInstanceInviteStatus(
    userId: string,
    instanceId: string,
    status: ShiftInviteStatus,
    actorUserId: string = userId,
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

    const source = actorUserId === userId ? 'self' : 'admin';
    const organizationId = await this.resolveOrganizationId(
      instance.master.organizationUnitId,
    );
    this.postHogService.capture({
      event: POSTHOG_EVENT.SHIFT_INSTANCE_INVITE_UPDATE,
      userId,
      properties: {
        surface:
          source === 'admin'
            ? POSTHOG_SURFACE.BACKOFFICE
            : POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: organizationId,
        organization_unit_id: instance.master.organizationUnitId,
        source,
        shift_id: instance.master.id,
        shift_instance_id: instanceId,
        invite_status: status,
      },
    });
    if (
      status === ShiftInviteStatus.ACCEPTED ||
      status === ShiftInviteStatus.SELF_JOINED
    ) {
      this.postHogService.capture({
        event: POSTHOG_EVENT.SHIFT_INSTANCE_JOIN,
        userId,
        properties: {
          surface:
            source === 'admin'
              ? POSTHOG_SURFACE.BACKOFFICE
              : POSTHOG_SURFACE.VOLUNTEERING,
          organization_id: organizationId,
          organization_unit_id: instance.master.organizationUnitId,
          source: POSTHOG_JOIN_SOURCE.INVITE_ACCEPT,
          shift_id: instance.master.id,
          shift_instance_id: instanceId,
        },
      });
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

  private async getShiftInstanceRequiredFormStatuses(
    userId: string,
    shiftInstanceId: string,
  ): Promise<RequiredFormStatus[]> {
    return this.requiredFormService.getRequiredFormStatuses(userId, {
      targetType: RequiredFormTargetType.SHIFT_INSTANCE,
      targetId: shiftInstanceId,
    });
  }

  private async checkShiftAndInstanceRequiredForms(
    userId: string,
    shiftId: string,
    shiftInstanceId: string,
  ): Promise<{
    satisfied: boolean;
    requiredForms: RequiredFormStatus[];
  }> {
    const [shiftForms, instanceForms] = await Promise.all([
      this.getShiftRequiredFormStatuses(userId, shiftId),
      this.getShiftInstanceRequiredFormStatuses(userId, shiftInstanceId),
    ]);
    const requiredForms = [...shiftForms, ...instanceForms];
    const missingForms = requiredForms.filter((s) => !s.submitted);
    return { satisfied: missingForms.length === 0, requiredForms };
  }

  private async resolveOrganizationId(
    organizationUnitId: string,
  ): Promise<string | undefined> {
    const unit = await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
      columns: { organizationId: true },
    });
    return unit?.organizationId ?? undefined;
  }

  private async captureShiftInstanceJoin(input: {
    userId: string;
    organizationUnitId: string;
    shiftId: string;
    shiftInstanceId: string;
    source: PostHogJoinSource;
  }): Promise<void> {
    this.postHogService.capture({
      event: POSTHOG_EVENT.SHIFT_INSTANCE_JOIN,
      userId: input.userId,
      properties: {
        surface:
          input.source === POSTHOG_JOIN_SOURCE.MEMBERSHIP_APPROVE
            ? POSTHOG_SURFACE.BACKOFFICE
            : POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: await this.resolveOrganizationId(
          input.organizationUnitId,
        ),
        organization_unit_id: input.organizationUnitId,
        source: input.source,
        shift_id: input.shiftId,
        shift_instance_id: input.shiftInstanceId,
      },
    });
  }
}
