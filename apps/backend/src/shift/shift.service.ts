import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, SQL } from 'drizzle-orm';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { UserEntity } from '../database/schema';
import { NotFoundGraphQLError } from '../graphql/errors/not-found.error';
import type { PaginationInput } from '../graphql/pagination.input';
import { UserService } from '../user/user.service';
import { slugify } from '../utils/slug.util';
import { ShiftInviteStatus, ShiftVisibility } from './enums';
import { CreateShiftInput } from './inputs/create-shift.input';
import { UpdateShiftInput } from './inputs/update-shift.input';
import type { ShiftEntity } from './schemas/shift.schema';

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
    organizationId: string,
    projectId: string | null,
    pagination: PaginationInput,
  ): Promise<{ shifts: ShiftEntity[]; total: number }> {
    const projectCondition = projectId
      ? eq(schema.shifts.projectId, projectId)
      : undefined;

    const condition: SQL<unknown> | undefined = and(
      eq(schema.shifts.organizationId, organizationId),
      projectCondition,
    );

    const shifts = await this.db
      .select()
      .from(schema.shifts)
      .where(condition)
      .limit(pagination.limit)
      .offset(pagination.offset);

    const [{ rowCount }] = await this.db
      .select({ rowCount: count() })
      .from(schema.shifts)
      .where(condition);

    const total = rowCount;
    return { shifts, total };
  }

  async create(
    userId: string,
    organizationId: string,
    input: CreateShiftInput,
  ): Promise<ShiftEntity> {
    const [shift] = await this.db
      .insert(schema.shifts)
      .values({
        ...input,
        slug: slugify(input.title),
        createdById: userId,
        organizationId,
      })
      .returning();

    /**
     * If the shift is visible to all members, we automatically approve the invites for all members.
     * If the shift is visible to specific members, we create invites for those members and approve them automatically.
     * This is a temporary solution to avoid manually approving invites for the prototype.
     * TODO: Refactor this when the prototype is complete.
     */

    if (input.visibility === ShiftVisibility.ALL_MEMBERS) {
      const members = await this.db.query.memberships.findMany({
        where: { organizationId },
      });
      const memberIds = members
        .map((member) => member.userId)
        .filter(
          (memberId): memberId is string =>
            memberId !== null && memberId !== userId,
        );
      await this.createAndAutoApproveShiftInvites(shift.id, memberIds);
    } else if (input.invitedMemberIds && input.invitedMemberIds.length > 0) {
      await this.createAndAutoApproveShiftInvites(
        shift.id,
        input.invitedMemberIds,
      );
    }

    return shift;
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

    await this.db
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
    if (memberIds.length === 0) return;

    await this.db
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

  async update(
    userId: string,
    id: string,
    organizationId: string,
    input: UpdateShiftInput,
  ): Promise<ShiftEntity> {
    const { title, ...rest } = input;

    const [shift] = await this.db
      .update(schema.shifts)
      .set({
        title,
        ...rest,
        ...(title && { slug: slugify(title) }),
      })
      .where(
        and(
          eq(schema.shifts.id, id),
          eq(schema.shifts.organizationId, organizationId),
        ),
      )
      .returning();

    if (!shift) {
      throw new NotFoundGraphQLError('Shift not found');
    }

    /**
     * If the shift is visible to all members, we automatically approve the invites for all members.
     * If the shift is visible to specific members, we create invites for those members and approve them automatically.
     * This is a temporary solution to avoid manually approving invites for the prototype.
     * TODO: Refactor this when the prototype is complete.
     */

    if (input.visibility === ShiftVisibility.ALL_MEMBERS) {
      const members = await this.db.query.memberships.findMany({
        where: { organizationId },
      });
      const memberIds = members
        .map((member) => member.userId)
        .filter(
          (memberId): memberId is string =>
            memberId !== null && memberId !== userId,
        );
      await this.createAndAutoApproveShiftInvites(shift.id, memberIds);
    } else if (input.invitedMemberIds && input.invitedMemberIds.length > 0) {
      await this.createAndAutoApproveShiftInvites(
        shift.id,
        input.invitedMemberIds,
      );
    }

    return shift;
  }

  async delete(id: string, organizationId: string): Promise<ShiftEntity> {
    const shift = await this.db.query.shifts.findFirst({
      where: {
        id,
        organizationId,
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
          eq(schema.shifts.organizationId, organizationId),
        ),
      )
      .returning();

    return deletedShift;
  }

  async findCreator(createdById: string): Promise<UserEntity> {
    return this.userService.findByIdOrThrow(createdById);
  }
}
