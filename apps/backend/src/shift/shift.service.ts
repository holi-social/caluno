import { Inject, Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { NotFoundGraphQLError } from 'src/graphql/errors/not-found.error';
import type { PaginationInput } from 'src/graphql/pagination.input';
import { slugify } from 'src/utils/slug.util';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { UserEntity } from '../database/schema';
import { CreateShiftInput } from './inputs/create-shift.input';
import type { ShiftEntity } from './schemas/shift.schema';

@Injectable()
export class ShiftService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string): Promise<ShiftEntity | undefined> {
    return this.db.query.shifts.findFirst({
      where: eq(schema.shifts.id, id),
    });
  }

  async findAll(
    pagination: PaginationInput,
  ): Promise<{ shifts: ShiftEntity[]; total: number }> {
    const shifts = await this.db.query.shifts.findMany({
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(schema.shifts);

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
    const shift = await this.findById(shiftId);

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
