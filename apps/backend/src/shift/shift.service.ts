import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, count, eq, gte, inArray } from 'drizzle-orm';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/constants';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { ShiftInstanceInviteEntity, UserEntity } from '../database/schema';

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
  private readonly logger = new Logger(ShiftService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly membershipService: MembershipService,
    private readonly notificationService: NotificationService,
  ) {}

  async findById(id: string): Promise<ShiftEntity> {
    const shift = await this.db.query.shifts.findFirst({
      where: { id },
    });

    if (!shift) {
      throw new NotFoundGraphQLError(`Shift with ID ${id} not found`);
    }

    return shift;
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
    const { invitedMemberIds, eventId, ...shiftInput } = input;
    const durationMinutes =
      (shiftInput.endsAt.getTime() - shiftInput.startsAt.getTime()) / 60000;

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
            invitedMemberIds,
          );
        }
      }

      return shift;
    });

    if (invitedMemberIds?.length) {
      void this.emitShiftInvitedNotification(shift, invitedMemberIds);
    }

    return shift;
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

  async inviteMembersToShiftInstanceWithAutoApproval(
    instanceId: string,
    memberIds: string[],
    organizationUnitId: string,
  ): Promise<ShiftInstanceEntity> {
    const instance = await this.findInstanceById(
      instanceId,
      organizationUnitId,
    );
    const shift = await this.findOrgUnitsShift(
      instance.masterId,
      organizationUnitId,
    );

    if (instance.isCancelled) {
      throw new NotFoundGraphQLError(
        `Shift instance with ID ${instanceId} not found`,
      );
    }

    if (memberIds.length === 0) {
      return instance;
    }

    const existingInvites = await this.db
      .selectDistinct({ userId: schema.shiftInstanceInvites.userId })
      .from(schema.shiftInstanceInvites)
      .where(
        and(
          eq(schema.shiftInstanceInvites.instanceId, instanceId),
          inArray(schema.shiftInstanceInvites.userId, memberIds),
          eq(schema.shiftInstanceInvites.status, ShiftInviteStatus.ACCEPTED),
        ),
      );

    const alreadyInvited = new Set(existingInvites.map((i) => i.userId));
    const newMemberIds = memberIds.filter((id) => !alreadyInvited.has(id));

    if (newMemberIds.length === 0) {
      return instance;
    }

    const maxVolunteers = instance.overrideMaxVolunteers ?? shift.maxVolunteers;

    if (!maxVolunteers) {
      await this.createInvitesForInstances(this.db, [instanceId], newMemberIds);
      void this.emitShiftInstanceInvitedNotification(
        shift,
        newMemberIds,
        instance,
      );
      return instance;
    }

    await this.db.transaction(async (tx) => {
      const [capacity] = await tx
        .select({ current: count() })
        .from(schema.shiftInstanceInvites)
        .where(
          and(
            eq(schema.shiftInstanceInvites.status, ShiftInviteStatus.ACCEPTED),
            eq(schema.shiftInstanceInvites.instanceId, instanceId),
          ),
        );

      if ((capacity?.current ?? 0) + newMemberIds.length > maxVolunteers) {
        throw new ConflictGraphQLError(
          `Cannot invite members: instance would exceed capacity of ${maxVolunteers}`,
        );
      }

      await this.createInvitesForInstances(tx, [instanceId], newMemberIds);
    });

    void this.emitShiftInstanceInvitedNotification(
      shift,
      newMemberIds,
      instance,
    );

    return instance;
  }

  async uninviteMembersFromShiftInstance(
    instanceId: string,
    memberIds: string[],
    organizationUnitId: string,
  ): Promise<ShiftInstanceEntity> {
    const instance = await this.findInstanceById(
      instanceId,
      organizationUnitId,
    );

    if (memberIds.length > 0) {
      await this.db
        .delete(schema.shiftInstanceInvites)
        .where(
          and(
            eq(schema.shiftInstanceInvites.instanceId, instanceId),
            inArray(schema.shiftInstanceInvites.userId, memberIds),
          ),
        );
    }

    return instance;
  }

  async updateMembersForShiftInstance(
    instanceId: string,
    memberIds: string[],
    organizationUnitId: string,
    options: { inviteToAllInstances?: boolean } = {},
  ): Promise<ShiftInstanceEntity> {
    const instance = await this.findInstanceById(
      instanceId,
      organizationUnitId,
    );

    const currentVolunteers = await this.db
      .selectDistinct({ userId: schema.shiftInstanceInvites.userId })
      .from(schema.shiftInstanceInvites)
      .where(
        and(
          eq(schema.shiftInstanceInvites.instanceId, instanceId),
          eq(schema.shiftInstanceInvites.status, ShiftInviteStatus.ACCEPTED),
        ),
      );

    const currentIds = new Set(currentVolunteers.map((v) => v.userId));
    const newIds = new Set(memberIds);

    const toAdd = memberIds.filter((id) => !currentIds.has(id));
    const toRemove = [...currentIds].filter((id) => !newIds.has(id));

    if (options.inviteToAllInstances) {
      if (toRemove.length > 0) {
        await this.uninviteMembersFromShiftInstance(
          instanceId,
          toRemove,
          organizationUnitId,
        );
      }

      if (memberIds.length > 0) {
        await this.inviteMembersToShiftWithAutoApproval(
          instance.masterId,
          memberIds,
          organizationUnitId,
        );
      }

      return this.findInstanceById(instanceId, organizationUnitId);
    }

    if (toAdd.length > 0) {
      await this.inviteMembersToShiftInstanceWithAutoApproval(
        instanceId,
        toAdd,
        organizationUnitId,
      );
    }

    if (toRemove.length > 0) {
      await this.uninviteMembersFromShiftInstance(
        instanceId,
        toRemove,
        organizationUnitId,
      );
    }

    return this.findInstanceById(instanceId, organizationUnitId);
  }

  async inviteMembersToShiftWithAutoApproval(
    shiftId: string,
    memberIds: string[],
    organizationUnitId: string,
  ): Promise<ShiftEntity> {
    const shift = await this.findOrgUnitsShift(shiftId, organizationUnitId);

    if (memberIds.length === 0) {
      return shift;
    }

    const newMemberIds = await this.addMembersToAllShiftInstances(
      shift,
      memberIds,
    );
    void this.emitShiftInvitedNotification(shift, newMemberIds);

    return shift;
  }

  private async addMembersToAllShiftInstances(
    shift: ShiftEntity,
    memberIds: string[],
  ): Promise<string[]> {
    if (memberIds.length === 0) {
      return [];
    }

    const newMemberIds = await this.filterMembersNotFullyInvitedToShift(
      shift.id,
      memberIds,
    );

    await this.db.transaction(async (tx) => {
      const instances = await tx.query.shiftInstances.findMany({
        where: {
          masterId: shift.id,
          isCancelled: false,
        },
        columns: {
          id: true,
          overrideMaxVolunteers: true,
        },
      });

      if (instances.length === 0) {
        return;
      }

      const instanceIds = instances.map((instance) => instance.id);
      const capacityLimitedInstances = instances.filter(
        (instance) => instance.overrideMaxVolunteers ?? shift.maxVolunteers,
      );

      if (capacityLimitedInstances.length > 0) {
        const capacityLimitedInstanceIds = capacityLimitedInstances.map(
          (instance) => instance.id,
        );
        const [capacities, acceptedRequestedInvites] = await Promise.all([
          tx
            .select({
              instanceId: schema.shiftInstanceInvites.instanceId,
              current: count(),
            })
            .from(schema.shiftInstanceInvites)
            .where(
              and(
                inArray(
                  schema.shiftInstanceInvites.instanceId,
                  capacityLimitedInstanceIds,
                ),
                eq(
                  schema.shiftInstanceInvites.status,
                  ShiftInviteStatus.ACCEPTED,
                ),
              ),
            )
            .groupBy(schema.shiftInstanceInvites.instanceId),
          tx
            .select({
              instanceId: schema.shiftInstanceInvites.instanceId,
              userId: schema.shiftInstanceInvites.userId,
            })
            .from(schema.shiftInstanceInvites)
            .where(
              and(
                inArray(
                  schema.shiftInstanceInvites.instanceId,
                  capacityLimitedInstanceIds,
                ),
                inArray(schema.shiftInstanceInvites.userId, memberIds),
                eq(
                  schema.shiftInstanceInvites.status,
                  ShiftInviteStatus.ACCEPTED,
                ),
              ),
            ),
        ]);

        const capacityByInstanceId = new Map(
          capacities.map((capacity) => [capacity.instanceId, capacity.current]),
        );
        const acceptedRequestedByInstanceId = new Map<string, Set<string>>();

        for (const invite of acceptedRequestedInvites) {
          const accepted =
            acceptedRequestedByInstanceId.get(invite.instanceId) ?? new Set();
          accepted.add(invite.userId);
          acceptedRequestedByInstanceId.set(invite.instanceId, accepted);
        }

        for (const instance of capacityLimitedInstances) {
          const maxVolunteers =
            instance.overrideMaxVolunteers ?? shift.maxVolunteers;
          if (!maxVolunteers) continue;

          const alreadyAccepted =
            acceptedRequestedByInstanceId.get(instance.id) ?? new Set();
          const newInviteCount = memberIds.filter(
            (memberId) => !alreadyAccepted.has(memberId),
          ).length;

          if (
            (capacityByInstanceId.get(instance.id) ?? 0) + newInviteCount >
            maxVolunteers
          ) {
            throw new ConflictGraphQLError(
              `Cannot invite members: instance would exceed capacity of ${maxVolunteers}`,
            );
          }
        }
      }

      await this.createInvitesForInstances(tx, instanceIds, memberIds);
    });

    return newMemberIds;
  }

  private async filterMembersNotFullyInvitedToShift(
    shiftId: string,
    memberIds: string[],
  ): Promise<string[]> {
    if (memberIds.length === 0) {
      return [];
    }

    const instances = await this.db.query.shiftInstances.findMany({
      where: {
        masterId: shiftId,
        isCancelled: false,
      },
      columns: { id: true },
    });
    const instanceIds = instances.map((instance) => instance.id);

    if (instanceIds.length === 0) {
      return memberIds;
    }

    const existingInvites = await this.db
      .select({
        userId: schema.shiftInstanceInvites.userId,
        instanceId: schema.shiftInstanceInvites.instanceId,
      })
      .from(schema.shiftInstanceInvites)
      .where(
        and(
          inArray(schema.shiftInstanceInvites.instanceId, instanceIds),
          inArray(schema.shiftInstanceInvites.userId, memberIds),
          eq(schema.shiftInstanceInvites.status, ShiftInviteStatus.ACCEPTED),
        ),
      );

    const invitedInstancesByUser = new Map<string, Set<string>>();

    for (const invite of existingInvites) {
      const invitedInstances =
        invitedInstancesByUser.get(invite.userId) ?? new Set<string>();
      invitedInstances.add(invite.instanceId);
      invitedInstancesByUser.set(invite.userId, invitedInstances);
    }

    return memberIds.filter(
      (memberId) =>
        (invitedInstancesByUser.get(memberId)?.size ?? 0) < instanceIds.length,
    );
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

  findInvite(
    organizationUnitId: string,
    instanceId: string,
    userId: string,
  ): Promise<ShiftInstanceInviteEntity | undefined> {
    const instanceInvite = this.db.query.shiftInstanceInvites.findFirst({
      where: {
        userId,
        instance: {
          master: { organizationUnitId, isDeleted: false },
          id: instanceId,
        },
      },
    });

    return instanceInvite;
  }

  async countByEventId(eventId: string): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(schema.shifts)
      .where(
        and(
          eq(schema.shifts.eventId, eventId),
          eq(schema.shifts.isDeleted, false),
        ),
      );
    return result[0]?.count ?? 0;
  }

  async findByEventId(eventId: string): Promise<ShiftEntity[]> {
    return this.db.query.shifts.findMany({
      where: { eventId, isDeleted: false },
      orderBy: { originalStartsAt: 'asc' },
    });
  }

  async update(
    userId: string,
    id: string,
    organizationUnitId: string,
    input: UpdateShiftInput,
  ): Promise<ShiftEntity> {
    const { invitedMemberIds, eventId: inputEventId, ...shiftInput } = input;

    return this.db.transaction(async (tx) => {
      let shift = await tx.query.shifts.findFirst({
        where: { id, organizationUnitId },
      });

      if (!shift) {
        throw new NotFoundGraphQLError('Shift not found');
      }

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
        Object.keys(shiftInput).length > 0 || inputEventId !== undefined;

      if (hasValuesToUpdate) {
        const durationMinutes =
          input.endsAt && input.startsAt
            ? (input.endsAt.getTime() - input.startsAt.getTime()) / 60000
            : undefined;

        const [updatedShift] = await tx
          .update(schema.shifts)
          .set({
            ...shiftInput,
            slug: shiftInput.title ? slugify(shiftInput.title) : undefined,
            originalStartsAt: input.startsAt,
            durationMinutes,
            ...(inputEventId !== undefined ? { eventId: inputEventId } : {}),
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
      } else {
        if (input.startsAt && input.endsAt) {
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

  private emitShiftInstanceInvitedNotification(
    shift: ShiftEntity,
    invitedUserIds: string[],
    instance: ShiftInstanceEntity,
  ): void {
    if (invitedUserIds.length === 0) {
      return;
    }

    void this.loadAndEmitShiftInstanceInvitedNotification(
      shift,
      invitedUserIds,
      instance,
    );
  }

  private emitShiftInvitedNotification(
    shift: ShiftEntity,
    invitedUserIds: string[],
  ): void {
    if (invitedUserIds.length === 0) {
      return;
    }

    void this.loadAndEmitShiftInvitedNotification(shift, invitedUserIds);
  }

  private async loadAndEmitShiftInstanceInvitedNotification(
    shift: ShiftEntity,
    invitedUserIds: string[],
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
    invitedUserIds: string[],
  ): Promise<void> {
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
    tx?: Database,
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

    const existingInvite = await db.query.shiftInstanceInvites.findFirst({
      where: {
        instanceId,
        userId,
      },
      columns: { id: true },
    });

    if (existingInvite) {
      return;
    }

    const maxVolunteers = instance.overrideMaxVolunteers ?? shift.maxVolunteers;

    if (maxVolunteers) {
      const [capacity] = await db
        .select({ current: count() })
        .from(schema.shiftInstanceInvites)
        .where(
          and(
            eq(schema.shiftInstanceInvites.status, ShiftInviteStatus.ACCEPTED),
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
        status: ShiftInviteStatus.ACCEPTED,
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

    await this.addMembersToAllShiftInstances(shift, [userId]);

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
        };
      }

      if (result.status === 'PENDING') {
        return {
          status: JoinStatus.PENDING,
          shiftInstance: instance,
          membershipRequest: result.membershipRequest,
        };
      }

      if (result.status === 'REJECTED') {
        return {
          status: JoinStatus.REJECTED,
          shiftInstance: instance,
          membershipRequest: result.membershipRequest,
        };
      }

      await this.joinShiftInstance(userId, instanceId);
      return {
        status: JoinStatus.JOINED,
        shiftInstance: instance,
      };
    }

    await this.joinShiftInstance(userId, instanceId);
    return {
      status: JoinStatus.JOINED,
      shiftInstance: instance,
    };
  }
}
