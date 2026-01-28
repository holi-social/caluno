import { Inject, Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PaginationInput } from 'src/graphql/pagination.input';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
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
}
