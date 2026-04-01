import { Inject, Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import { NotFoundGraphQLError } from '../../graphql/errors';
import type { PaginationInput } from '../../graphql/pagination.input';
import { CreateRequirementInput } from '../inputs/create-requirement.input';
import { UpdateRequirementInput } from '../inputs/update-requirement.input';
import type { RequirementEntity } from '../schemas/requirement.schema';

@Injectable()
export class RequirementService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async findById(id: string): Promise<RequirementEntity | undefined> {
    return this.db.query.requirements.findFirst({ where: { id } });
  }

  async findAll(
    pagination: PaginationInput,
  ): Promise<{ items: RequirementEntity[]; total: number }> {
    const items = await this.db.query.requirements.findMany({
      limit: pagination.limit,
      offset: pagination.offset,
      orderBy: { createdAt: 'desc' },
    });
    const [{ total }] = await this.db.query.requirements.findMany({
      columns: {},
      extras: { total: count() },
    });
    return { items, total };
  }

  async create(input: CreateRequirementInput): Promise<RequirementEntity> {
    const [requirement] = await this.db
      .insert(schema.requirements)
      .values(input)
      .returning();
    return requirement;
  }

  async update(
    id: string,
    input: UpdateRequirementInput,
  ): Promise<RequirementEntity> {
    const [requirement] = await this.db
      .update(schema.requirements)
      .set(input)
      .where(eq(schema.requirements.id, id))
      .returning();

    if (!requirement) {
      throw new NotFoundGraphQLError('Requirement not found');
    }

    return requirement;
  }

  async delete(id: string): Promise<RequirementEntity> {
    const [requirement] = await this.db
      .delete(schema.requirements)
      .where(eq(schema.requirements.id, id))
      .returning();
    if (!requirement) {
      throw new NotFoundGraphQLError('Requirement not found');
    }
    return requirement;
  }
}
