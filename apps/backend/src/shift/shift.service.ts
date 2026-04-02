import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, SQL } from 'drizzle-orm';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { UserEntity } from '../database/schema';
import { ConflictGraphQLError, NotFoundGraphQLError } from '../graphql/errors';
import type { PaginationInput } from '../graphql/pagination.input';
import { UserService } from '../user/user.service';
import { slugify } from '../utils/slug.util';
import { ShiftInviteStatus, ShiftVisibility } from './enums';
import { CreateShiftInput } from './inputs/create-shift.input';
import { UpdateShiftInput } from './inputs/update-shift.input';
import type { ShiftEntity } from './schemas/shift.schema';
import type { ShiftRecurrenceRuleEntity } from './schemas/shift-recurrence-rule.schema';

@Injectable()
export class ShiftService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly userService: UserService,
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

  async findAll(
    organizationUnitId: string,
    pagination: PaginationInput,
  ): Promise<{ shifts: ShiftEntity[]; total: number }> {
    const condition: SQL<unknown> | undefined = and(
      eq(schema.shifts.organizationUnitId, organizationUnitId),
    );

    const shifts = await this.db
      .select()
      .from(schema.shifts)
      .where(condition)
      .orderBy(desc(schema.shifts.startsAt))
      .limit(pagination.limit)
      .offset(pagination.offset);

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(schema.shifts)
      .where(condition);

    return { shifts, total };
  }

  async create(
    userId: string,
    organizationUnitId: string,
    input: CreateShiftInput,
  ): Promise<ShiftEntity> {
    const {
      recurrenceDays,
      recurrenceEndsAt,
      invitedMemberIds,
      ...shiftInput
    } = input;

    return this.db.transaction(async (tx) => {
      const [shift] = await tx
        .insert(schema.shifts)
        .values({
          ...shiftInput,
          slug: slugify(input.title),
          createdById: userId,
          organizationUnitId,
        })
        .returning();

      if (recurrenceDays && recurrenceDays.length > 0) {
        await tx.insert(schema.shiftRecurrenceRules).values({
          shiftId: shift.id,
          daysOfWeek: recurrenceDays,
          endsAt: recurrenceEndsAt ?? null,
        });
      }

      /**
       * If the shift is visible to all members, we automatically approve the invites for all members.
       * If the shift is visible to specific members, we create invites for those members and approve them automatically.
       * This is a temporary solution to avoid manually approving invites for the prototype.
       * TODO: Refactor this when the prototype is complete.
       */

      if (input.visibility === ShiftVisibility.ALL_MEMBERS) {
        const members = await tx.query.memberships.findMany({
          where: { role: { organizationUnitId } },
        });
        const memberIds = members
          .map((member) => member.userId)
          .filter(
            (memberId): memberId is string =>
              memberId !== null && memberId !== userId,
          );
        await this.createAndAutoApproveShiftInvitesWithTx(
          tx,
          shift.id,
          memberIds,
          shift.maxVolunteers,
        );
      } else if (invitedMemberIds && invitedMemberIds.length > 0) {
        await this.createAndAutoApproveShiftInvitesWithTx(
          tx,
          shift.id,
          invitedMemberIds,
          shift.maxVolunteers,
        );
      }

      return shift;
    });
  }

  /**
   * Invites members to a shift and approves them automatically.
   * This is a temporary solution to avoid manually approving invites for the prototype.
   * TODO: Refactor this method when the prototype is complete.
   */
  async inviteMembersToShiftWithAutoApproval(
    shiftId: string,
    memberIds: string[],
  ): Promise<ShiftEntity> {
    const shift = await this.db.query.shifts.findFirst({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundGraphQLError('Shift not found');
    }

    await this.checkCapacity(
      this.db,
      shiftId,
      shift.maxVolunteers,
      memberIds.length,
    );
    await this.createAndAutoApproveShiftInvites(shiftId, memberIds);

    return shift;
  }

  async findVolunteers(shiftId: string): Promise<UserEntity[]> {
    const volunteers = await this.db.query.users.findMany({
      where: {
        shiftInvites: {
          shiftId,
          status: ShiftInviteStatus.ACCEPTED,
        },
      },
    });

    return volunteers;
  }

  /**
   * Creates shift invites and approves them automatically.
   * This is a temporary solution to avoid manually approving invites for the prototype.
   * TODO: Remove this method when the prototype is complete.
   */

  private async createAndAutoApproveShiftInvites(
    shiftId: string,
    memberIds: string[],
  ): Promise<void> {
    await this.createAndAutoApproveShiftInvitesWithTx(
      this.db,
      shiftId,
      memberIds,
    );
  }

  private async createAndAutoApproveShiftInvitesWithTx(
    tx: Pick<Database, 'insert' | 'select'>,
    shiftId: string,
    memberIds: string[],
    maxVolunteers?: number | null,
  ): Promise<void> {
    if (memberIds.length === 0) return;

    await this.checkCapacity(
      tx,
      shiftId,
      maxVolunteers ?? null,
      memberIds.length,
    );

    await tx
      .insert(schema.shiftInvites)
      .values(
        memberIds.map((memberId) => ({
          shiftId,
          userId: memberId,
          status: ShiftInviteStatus.ACCEPTED,
        })),
      )
      .onConflictDoUpdate({
        target: [schema.shiftInvites.shiftId, schema.shiftInvites.userId],
        set: { status: ShiftInviteStatus.ACCEPTED },
      });
  }

  private async checkCapacity(
    db: Pick<Database, 'select'>,
    shiftId: string,
    maxVolunteers: number | null | undefined,
    additionalCount: number,
  ): Promise<void> {
    if (!maxVolunteers) return;

    const [{ current }] = await db
      .select({ current: count() })
      .from(schema.shiftInvites)
      .where(
        and(
          eq(schema.shiftInvites.shiftId, shiftId),
          eq(schema.shiftInvites.status, ShiftInviteStatus.ACCEPTED),
        ),
      );

    if (current + additionalCount > maxVolunteers) {
      throw new ConflictGraphQLError(
        `This shift has reached its maximum capacity of ${maxVolunteers} volunteers`,
      );
    }
  }

  async update(
    userId: string,
    id: string,
    organizationUnitId: string,
    input: UpdateShiftInput,
  ): Promise<ShiftEntity> {
    const {
      title,
      recurrenceDays,
      recurrenceEndsAt,
      invitedMemberIds,
      ...rest
    } = input;

    return this.db.transaction(async (tx) => {
      const [shift] = await tx
        .update(schema.shifts)
        .set({
          title,
          ...rest,
          ...(title && { slug: slugify(title) }),
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

      if (recurrenceDays !== undefined) {
        await tx
          .delete(schema.shiftRecurrenceRules)
          .where(eq(schema.shiftRecurrenceRules.shiftId, id));

        if (recurrenceDays && recurrenceDays.length > 0) {
          await tx.insert(schema.shiftRecurrenceRules).values({
            shiftId: shift.id,
            daysOfWeek: recurrenceDays,
            endsAt: recurrenceEndsAt ?? null,
          });
        }
      }

      /**
       * If the shift is visible to all members, we automatically approve the invites for all members.
       * If the shift is visible to specific members, we create invites for those members and approve them automatically.
       * This is a temporary solution to avoid manually approving invites for the prototype.
       * TODO: Refactor this when the prototype is complete.
       */

      if (input.visibility === ShiftVisibility.ALL_MEMBERS) {
        const members = await tx.query.memberships.findMany({
          where: { role: { organizationUnitId } },
        });
        const memberIds = members
          .map((member) => member.userId)
          .filter(
            (memberId): memberId is string =>
              memberId !== null && memberId !== userId,
          );
        await this.createAndAutoApproveShiftInvitesWithTx(
          tx,
          shift.id,
          memberIds,
          shift.maxVolunteers,
        );
      } else if (invitedMemberIds && invitedMemberIds.length > 0) {
        await this.createAndAutoApproveShiftInvitesWithTx(
          tx,
          shift.id,
          invitedMemberIds,
          shift.maxVolunteers,
        );
      }

      return shift;
    });
  }

  async delete(id: string, organizationUnitId: string): Promise<ShiftEntity> {
    const shift = await this.db.query.shifts.findFirst({
      where: {
        id,
        organizationUnitId,
      },
    });

    if (!shift) {
      throw new NotFoundGraphQLError(`Shift with ID ${id} not found`);
    }

    const [deletedShift] = await this.db
      .delete(schema.shifts)
      .where(
        and(
          eq(schema.shifts.id, id),
          eq(schema.shifts.organizationUnitId, organizationUnitId),
        ),
      )
      .returning();

    return deletedShift;
  }

  async findRecurrenceRule(
    shiftId: string,
  ): Promise<ShiftRecurrenceRuleEntity | null> {
    const rule = await this.db.query.shiftRecurrenceRules.findFirst({
      where: { shiftId },
    });
    return rule ?? null;
  }

  async findCreator(createdById: string): Promise<UserEntity> {
    return this.userService.findByIdOrThrow(createdById);
  }

  async findActiveShifts(
    organizationUnitId: string,
    pagination: PaginationInput,
  ): Promise<{ shifts: ShiftEntity[]; total: number }> {
    // Increase the window either side by 1hr to show shifts that where just active or just about to be active
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const condition = {
      organizationUnitId,
      startsAt: { lt: oneHourFromNow },
      endsAt: { gt: oneHourAgo },
    };

    const shifts = await this.db.query.shifts.findMany({
      where: condition,
      orderBy: { createdAt: 'desc' },
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const [{ total }] = await this.db.query.shifts.findMany({
      columns: {},
      extras: { total: count() },
      where: condition,
    });

    return { shifts, total };
  }
}
