import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { ForbiddenGraphQLError } from '../graphql/errors';
import type { PaginationInput } from '../graphql/pagination.input';
import type { MembershipService } from '../membership/membership.service';
import type { Task } from '../task/models/task.model';
import type { TaskService } from '../task/task.service';
import type { User } from '../user/models/user.model';
import type { UserService } from '../user/user.service';
import { slugify } from '../utils';
import type { CreateOpportunityInput } from './inputs/create-opportunity.input';
import type { OpportunityMapper } from './mappers/opportunity.mapper';
import {
  type Opportunity,
  OpportunityPaginatedResponse,
} from './models/opportunity.model';

@Injectable()
export class OpportunityService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly mapper: OpportunityMapper,
    private readonly userService: UserService,
    private readonly membershipService: MembershipService,
    private readonly taskService: TaskService,
  ) {}

  async findById(id: string): Promise<Opportunity | null> {
    const opportunity = await this.db.query.opportunities.findFirst({
      where: eq(schema.opportunities.id, id),
    });
    return this.mapper.toModel(opportunity);
  }

  async findAllByOrganizationId(
    organizationId: string,
    pagination: PaginationInput,
  ): Promise<OpportunityPaginatedResponse> {
    const opportunities = await this.db.query.opportunities.findMany({
      where: eq(schema.opportunities.organizationId, organizationId),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return new OpportunityPaginatedResponse({
      items: this.mapper.toArray(opportunities),
      total: opportunities.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  async findCreator(createdById: string): Promise<User> {
    return this.userService.findByIdOrThrow(createdById);
  }

  async findTasksByOpportunityId(opportunityId: string): Promise<Task[]> {
    return this.taskService.findAllByOpportunityId(opportunityId);
  }

  async create(
    userId: string,
    input: CreateOpportunityInput,
  ): Promise<Opportunity> {
    const isStaff = await this.membershipService.isStaff(
      userId,
      input.organizationId,
    );

    if (!isStaff) {
      throw new ForbiddenGraphQLError(
        'You are not authorized to create an opportunity for this organization',
      );
    }

    const [opportunity] = await this.db
      .insert(schema.opportunities)
      .values({
        ...input,
        slug: slugify(input.title),
        createdById: userId,
      })
      .returning();

    return this.mapper.toModelOrThrow(opportunity);
  }
}
