import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, gte, inArray } from 'drizzle-orm';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/constants';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { UserEntity } from '../database/schema';
import {
  ConflictGraphQLError,
  ForbiddenGraphQLError,
  NotFoundGraphQLError,
} from '../graphql/errors';
import type { PaginationInput } from '../graphql/pagination.input';
import { MembershipService } from '../membership/membership.service';
import type { MembershipRequestEntity } from '../membership/schemas/membership-request.schema';
import type { RequirementProfileEntity } from '../requirement-profile/schemas/requirement-profile.schema';
import { JoinStatus } from '../shared/enums/join-status.enum';
import { UserService } from '../user/user.service';
import { slugify } from '../utils/slug.util';
import { ShiftInviteStatus, ShiftVisibility } from './enums';
import { CreateShiftInput } from './inputs/create-shift.input';
import { UpdateShiftInput } from './inputs/update-shift.input';
import type { ShiftEntity } from './schemas/shift.schema';
import type { ShiftInstanceEntity } from './schemas/shift-instance.schema';
import { expandShift } from './utils/rrule-expander';

@Injectable()
export class ShiftService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly membershipService: MembershipService,
  ) {}

  async findById(id: string, organizationUnitId: string): Promise<ShiftEntity> {
    const shift = await this.db.query.shifts.findFirst({
      where: { id, organizationUnitId },
    });

    if (!shift) {
      throw new NotFoundGraphQLError(`Shift with ID ${id} not found`);
    }
    return shift;
  }

  async findByIdPublic(id: string): Promise<ShiftEntity | null> {
    const result = await this.db.query.shifts.findFirst({
      where: {
        id,
        isDeleted: false,
        visibility: ShiftVisibility.ALL_MEMBERS,
      },
    });
    return result ?? null;
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

    if (
      !instance.master ||
      instance.master.organizationUnitId !== organizationUnitId
    ) {
      throw new NotFoundGraphQLError(`Shift instance with ID ${id} not found`);
    }

    return instance;
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
              status: {
                in: [ShiftInviteStatus.ACCEPTED, ShiftInviteStatus.PENDING],
              },
            },
          },
        },
        columns: { id: true, createdAt: true },
      }),
    ]);

    return this.mergeShiftIdsByRecency([...openShifts, ...joinedShifts]);
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

  private mergeShiftIdsByRecency(
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

  async create(
    userId: string,
    organizationUnitId: string,
    input: CreateShiftInput,
  ): Promise<ShiftEntity> {
    const { invitedMemberIds, ...shiftInput } = input;
    const durationMinutes =
      (shiftInput.endsAt.getTime() - shiftInput.startsAt.getTime()) / 60000;

    return this.db.transaction(async (tx) => {
      const [shift] = await tx
        .insert(schema.shifts)
        .values({
          title: shiftInput.title,
          slug: slugify(shiftInput.title),
          instructions: shiftInput.instructions,
          organizationUnitId,
          createdById: userId,
          location: shiftInput.location,
          visibility: shiftInput.visibility,
          maxVolunteers: shiftInput.maxVolunteers,
          rrule: shiftInput.rrule,
          originalStartsAt: shiftInput.startsAt,
          durationMinutes,
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
            invitedMemberIds,
          );
        }
      }

      return shift;
    });
  }

  private readonly MAX_INVITES_PER_OPERATION = 100000; // same as below easy guard to avoid not reasnable operations

  private async createInvitesForInstances(
    tx: Pick<Database, 'insert' | 'select'>,
    instanceIds: string[],
    memberIds: string[],
  ): Promise<void> {
    if (memberIds.length === 0 || instanceIds.length === 0) return;

    const totalInvites = instanceIds.length * memberIds.length;
    if (totalInvites > this.MAX_INVITES_PER_OPERATION) {
      throw new ConflictGraphQLError(
        `Cannot create ${totalInvites} invites. Maximum allowed is ${this.MAX_INVITES_PER_OPERATION}. ` +
          `Try reducing volunteers or using smaller recurrence ranges.`,
      );
    }

    const BATCH_SIZE = 1000; // this manual batch is just an easy guard to avoid going over the 65k pg linit
    const invites = instanceIds.flatMap((instanceId) =>
      memberIds.map((userId) => ({
        instanceId,
        userId,
        status: ShiftInviteStatus.ACCEPTED,
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

  async inviteMembersToShiftWithAutoApproval(
    shiftId: string,
    memberIds: string[],
    organizationUnitId: string,
  ): Promise<ShiftEntity> {
    const shift = await this.findById(shiftId, organizationUnitId);

    const instances = await this.db.query.shiftInstances.findMany({
      where: {
        masterId: shiftId,
        isCancelled: false,
      },
    });

    const instanceIds = instances.map((i) => i.id);

    const existingInvites = await this.db
      .selectDistinct({ userId: schema.shiftInstanceInvites.userId })
      .from(schema.shiftInstanceInvites)
      .where(
        and(
          inArray(schema.shiftInstanceInvites.instanceId, instanceIds),
          inArray(schema.shiftInstanceInvites.userId, memberIds),
          eq(schema.shiftInstanceInvites.status, ShiftInviteStatus.ACCEPTED),
        ),
      );

    const alreadyInvited = new Set(existingInvites.map((i) => i.userId));
    const newMemberIds = memberIds.filter((id) => !alreadyInvited.has(id));

    if (newMemberIds.length === 0) {
      return shift;
    }

    if (!shift.maxVolunteers) {
      await this.createInvitesForInstances(this.db, instanceIds, newMemberIds);
      return shift;
    }

    await this.db.transaction(async (tx) => {
      const capacityViolations = await tx
        .select({
          instanceId: schema.shiftInstanceInvites.instanceId,
          current: count(),
        })
        .from(schema.shiftInstanceInvites)
        .innerJoin(
          schema.shiftInstances,
          eq(schema.shiftInstanceInvites.instanceId, schema.shiftInstances.id),
        )
        .where(
          and(
            eq(schema.shiftInstanceInvites.status, ShiftInviteStatus.ACCEPTED),
            eq(schema.shiftInstances.masterId, shiftId),
          ),
        )
        .groupBy(schema.shiftInstanceInvites.instanceId);

      const violations = capacityViolations.filter(
        (c) =>
          c.current + newMemberIds.length > (shift.maxVolunteers ?? Infinity),
      );

      if (violations.length > 0) {
        throw new ConflictGraphQLError(
          `Cannot invite members: ${violations.length} instance(s) would exceed capacity of ${shift.maxVolunteers}`,
        );
      }

      await this.createInvitesForInstances(tx, instanceIds, newMemberIds);
    });

    return shift;
  }

  async findVolunteers(
    instanceId: string,
    organizationUnitId: string,
  ): Promise<UserEntity[]> {
    const instance = await this.findInstanceById(
      instanceId,
      organizationUnitId,
    );

    return this.db.query.users.findMany({
      where: {
        shiftInstanceInvites: {
          instanceId: instance.id,
          status: ShiftInviteStatus.ACCEPTED,
        },
      },
    });
  }

  async findShiftVolunteers(
    shiftId: string,
    organizationUnitId: string,
  ): Promise<UserEntity[]> {
    const shift = await this.db.query.shifts.findFirst({
      where: { id: shiftId, organizationUnitId },
    });
    if (!shift) {
      throw new NotFoundGraphQLError('Shift not found');
    }

    return this.db.query.users.findMany({
      where: {
        shiftInstanceInvites: {
          status: ShiftInviteStatus.ACCEPTED,
          instance: {
            masterId: shiftId,
            isCancelled: false,
          },
        },
      },
    });
  }

  async update(
    userId: string,
    id: string,
    organizationUnitId: string,
    input: UpdateShiftInput,
  ): Promise<ShiftEntity> {
    const { invitedMemberIds, ...shiftInput } = input;

    return this.db.transaction(async (tx) => {
      const existingShift = await tx.query.shifts.findFirst({
        where: { id, organizationUnitId },
      });

      if (!existingShift) {
        throw new NotFoundGraphQLError('Shift not found');
      }

      const [shift] = await tx
        .update(schema.shifts)
        .set({
          title: shiftInput.title,
          slug: shiftInput.title ? slugify(shiftInput.title) : undefined,
          instructions: shiftInput.instructions,
          location: shiftInput.location,
          visibility: shiftInput.visibility,
          maxVolunteers: shiftInput.maxVolunteers,
          rrule: shiftInput.rrule,
        })
        .where(
          and(
            eq(schema.shifts.id, id),
            eq(schema.shifts.organizationUnitId, organizationUnitId),
          ),
        )
        .returning();

      if (!shift) {
        throw new NotFoundGraphQLError('Shift not found');
      }

      if (shiftInput.rrule) {
        const now = new Date();

        const futureInstanceIds = await tx.query.shiftInstances.findMany({
          where: {
            masterId: id,
            isException: false,
            actualStartsAt: { gte: now },
          },
          columns: { id: true },
        });

        const existingInvites = await tx
          .select({ userId: schema.shiftInstanceInvites.userId })
          .from(schema.shiftInstanceInvites)
          .where(
            and(
              inArray(
                schema.shiftInstanceInvites.instanceId,
                futureInstanceIds.map((i) => i.id),
              ),
              eq(
                schema.shiftInstanceInvites.status,
                ShiftInviteStatus.ACCEPTED,
              ),
            ),
          );

        const existingInvitedUserIds = new Set(
          existingInvites.map((i) => i.userId),
        );

        await tx
          .delete(schema.shiftInstances)
          .where(
            and(
              eq(schema.shiftInstances.masterId, id),
              eq(schema.shiftInstances.isException, false),
              gte(schema.shiftInstances.actualStartsAt, now),
            ),
          );

        const instances = expandShift(
          shift.rrule,
          shift.originalStartsAt,
          shift.durationMinutes,
        );

        let createdInstanceIds: string[] = [];
        if (instances.length > 0) {
          const futureInstances = instances.filter(
            (i) => i.actualStartsAt >= now,
          );

          if (futureInstances.length > 0) {
            const created = await tx
              .insert(schema.shiftInstances)
              .values(
                futureInstances.map((inst) => ({
                  masterId: shift.id,
                  actualStartsAt: inst.actualStartsAt,
                  actualEndsAt: inst.actualEndsAt,
                  occurrenceIndex: inst.occurrenceIndex,
                })),
              )
              .returning({ id: schema.shiftInstances.id });
            createdInstanceIds = created.map((c) => c.id);
          }
        }

        if (existingInvitedUserIds.size > 0 && createdInstanceIds.length > 0) {
          await this.createInvitesForInstances(
            tx,
            createdInstanceIds,
            Array.from(existingInvitedUserIds),
          );
        }

        const futureExceptions = await tx.query.shiftInstances.findMany({
          where: {
            masterId: id,
            isException: true,
            actualStartsAt: { gte: now },
          },
        });

        const newInstanceDates = new Set(
          instances.map((i) => i.actualStartsAt.toISOString()),
        );
        const orphanedExceptions = futureExceptions.filter(
          (e) => !newInstanceDates.has(e.actualStartsAt.toISOString()),
        );

        if (orphanedExceptions.length > 0) {
          const orphanedIds = orphanedExceptions.map((e) => e.id);
          await tx
            .update(schema.shiftInstances)
            .set({ isException: false })
            .where(inArray(schema.shiftInstances.id, orphanedIds));
        }
      }

      if (
        shiftInput.visibility &&
        existingShift?.visibility === ShiftVisibility.ALL_MEMBERS &&
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

  async findActiveShifts(
    organizationUnitId: string,
    pagination: PaginationInput,
  ): Promise<{
    instances: ShiftInstanceEntity[];
    total: number;
  }> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const shifts = await this.db.query.shifts.findMany({
      where: {
        organizationUnitId,
        isDeleted: false,
      },
      columns: { id: true },
    });
    const shiftIds = shifts.map((s) => s.id);

    if (shiftIds.length === 0) {
      return { instances: [], total: 0 };
    }

    const instances = await this.db.query.shiftInstances.findMany({
      where: {
        actualStartsAt: { lt: oneHourFromNow },
        actualEndsAt: { gt: oneHourAgo },
        isCancelled: false,
        masterId: { in: shiftIds },
      },
      with: {
        master: true,
      },
      orderBy: { actualStartsAt: 'asc' },
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const totalResult = await this.db.query.shiftInstances.findMany({
      where: {
        actualStartsAt: { gte: oneHourAgo, lte: oneHourFromNow },
        isCancelled: false,
        masterId: { in: shiftIds },
      },
      columns: {},
      extras: { total: count() },
    });

    return {
      instances,
      total: totalResult[0]?.total ?? 0,
    };
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

  async findCreator(createdById: string): Promise<UserEntity> {
    return this.userService.findByIdOrThrow(createdById);
  }

  async joinShift(
    userId: string,
    shiftId: string,
    tx?: Database,
  ): Promise<ShiftEntity> {
    const db = tx ?? this.db;

    const shift = await db.query.shifts.findFirst({
      where: { id: shiftId, isDeleted: false },
    });

    if (!shift) {
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

    const instances = await db.query.shiftInstances.findMany({
      where: {
        masterId: shiftId,
        isCancelled: false,
      },
    });

    if (instances.length === 0) {
      throw new NotFoundGraphQLError('No instances found for this shift');
    }

    if (shift.maxVolunteers) {
      const capacityViolations = await db
        .select({
          instanceId: schema.shiftInstanceInvites.instanceId,
          current: count(),
        })
        .from(schema.shiftInstanceInvites)
        .where(
          and(
            eq(schema.shiftInstanceInvites.status, ShiftInviteStatus.ACCEPTED),
            inArray(
              schema.shiftInstanceInvites.instanceId,
              instances.map((i) => i.id),
            ),
          ),
        )
        .groupBy(schema.shiftInstanceInvites.instanceId);

      const violations = capacityViolations.filter(
        (c) =>
          shift.maxVolunteers !== null &&
          shift.maxVolunteers !== undefined &&
          c.current >= shift.maxVolunteers,
      );

      if (violations.length > 0) {
        throw new ConflictGraphQLError(
          `Cannot join shift: ${violations.length} instance(s) are at full capacity of ${shift.maxVolunteers}`,
        );
      }
    }

    const invites = instances.map((instance) => ({
      instanceId: instance.id,
      userId,
      status: ShiftInviteStatus.ACCEPTED,
    }));

    await db
      .insert(schema.shiftInstanceInvites)
      .values(invites)
      .onConflictDoNothing();

    return shift;
  }

  async requestJoinShift(
    userId: string,
    shiftId: string,
  ): Promise<{
    status: JoinStatus;
    shift: ShiftEntity;
    membershipRequest?: MembershipRequestEntity;
    requirementProfile?: RequirementProfileEntity;
    requirementStatuses?: Array<{
      requirementId: string;
      name: string;
      status: string;
    }>;
  }> {
    const shift = await this.findByIdPublic(shiftId);

    if (!shift || shift.isDeleted) {
      throw new NotFoundGraphQLError('Shift not found');
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
        shiftId,
      );

      if (result.status === 'REQUIREMENTS_NEEDED') {
        return {
          status: JoinStatus.REQUIREMENTS_NEEDED,
          shift,
          requirementProfile: result.requirementProfile,
          requirementStatuses: result.requirementStatuses,
        };
      }

      if (result.status === 'PENDING') {
        return {
          status: JoinStatus.PENDING,
          shift,
          membershipRequest: result.membershipRequest,
        };
      }

      if (result.status === 'REJECTED') {
        return {
          status: JoinStatus.REJECTED,
          shift,
          membershipRequest: result.membershipRequest,
        };
      }

      await this.joinShift(userId, shiftId);
      return {
        status: JoinStatus.JOINED,
        shift,
      };
    }

    await this.joinShift(userId, shiftId);
    return {
      status: JoinStatus.JOINED,
      shift,
    };
  }
}
