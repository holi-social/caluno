import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, inArray, or } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ForbiddenGraphQLError } from 'src/graphql/errors/forbidden.error';
import { NotFoundGraphQLError } from 'src/graphql/errors/not-found.error';
import type { PaginationInput } from 'src/graphql/pagination.input';
import { MembershipService } from 'src/membership/membership.service';
import { slugify } from 'src/utils/slug.util';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { UserEntity } from '../database/schema';
import { ShiftVisibility } from './enums';
import { CreateShiftInput } from './inputs/create-shift.input';
import type { ShiftEntity } from './schemas/shift.schema';

@Injectable()
export class ShiftService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly membershipService: MembershipService,
  ) {}

  async findById(
    userId: string,
    organizationId: string,
    id: string,
  ): Promise<ShiftEntity> {
    const shift = await this.db.query.shifts.findFirst({
      where: and(
        eq(schema.shifts.id, id),
        eq(schema.shifts.organizationId, organizationId),
      ),
    });

    if (!shift) {
      throw new NotFoundGraphQLError(`Shift with ID ${id} not found`);
    }

    const isStaff = await this.membershipService.isStaff(
      userId,
      shift.organizationId,
    );

    if (isStaff) {
      return shift;
    }

    if (shift.visibility === ShiftVisibility.ALL_MEMBERS) {
      return shift;
    }

    const invite = await this.db.query.shiftInvites.findFirst({
      where: and(
        eq(schema.shiftInvites.shiftId, id),
        eq(schema.shiftInvites.userId, userId),
      ),
    });

    if (invite) {
      return shift;
    }

    throw new ForbiddenGraphQLError(
      `You are not authorized to access this shift`,
    );
  }

  async findAll(
    userId: string,
    organizationId: string,
    pagination: PaginationInput,
  ): Promise<{ shifts: ShiftEntity[]; total: number }> {
    let shifts: ShiftEntity[] = [];
    let total: number = 0;

    const isStaff = await this.membershipService.isStaff(
      userId,
      organizationId,
    );

    if (isStaff) {
      shifts = await this.db.query.shifts.findMany({
        where: and(eq(schema.shifts.organizationId, organizationId)),
        limit: pagination.limit,
        offset: pagination.offset,
      });

      const [{ rowCount }] = await this.db
        .select({ rowCount: count() })
        .from(schema.shifts)
        .where(eq(schema.shifts.organizationId, organizationId));

      total = rowCount;
      return { shifts, total };
    }

    const invites = await this.db.query.shiftInvites.findMany({
      where: and(eq(schema.shiftInvites.userId, userId)),
    });

    const shiftIds = invites.map((invite) => invite.shiftId);

    const condition = and(
      eq(schema.shifts.organizationId, organizationId),
      or(
        eq(schema.shifts.visibility, ShiftVisibility.ALL_MEMBERS),
        inArray(schema.shifts.id, shiftIds),
      ),
    );

    shifts = await this.db.query.shifts.findMany({
      where: condition,
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const [{ rowCount }] = await this.db
      .select({ rowCount: count() })
      .from(schema.shifts)
      .where(condition);

    total = rowCount;
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

    if (input.invitedMemberIds && input.invitedMemberIds.length > 0) {
      await this.db.insert(schema.shiftInvites).values(
        input.invitedMemberIds.map((memberId) => ({
          shiftId: shift.id,
          userId: memberId,
        })),
      );
    }

    return shift;
  }

  async inviteMembersToShift(
    shiftId: string,
    memberIds: string[],
  ): Promise<ShiftEntity> {
    const shift = await this.db.query.shifts.findFirst({
      where: eq(schema.shifts.id, shiftId),
    });

    if (!shift) {
      throw new NotFoundGraphQLError('Shift not found');
    }

    await this.db.insert(schema.shiftInvites).values(
      memberIds.map((memberId) => ({
        shiftId,
        userId: memberId,
      })),
    );

    return shift;
  }

  async findVolunteers(shiftId: string): Promise<UserEntity[]> {
    const volunteers = await this.db.query.shiftInvites.findMany({
      where: eq(schema.shiftInvites.shiftId, shiftId),
      with: {
        user: true,
      },
    });

    return volunteers.map((volunteer) => volunteer.user);
  }
}
