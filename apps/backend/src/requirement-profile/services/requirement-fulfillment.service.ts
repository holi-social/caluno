import { Inject, Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import type { UserEntity } from '../../auth/schemas/auth.schema';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import { NotFoundGraphQLError } from '../../graphql/errors';
import type { PaginationInput } from '../../graphql/pagination.input';
import { UserService } from '../../user/user.service';
import { CreateRequirementFulfillmentInput } from '../inputs/create-requirement-fulfillment.input';
import { UpdateRequirementFulfillmentInput } from '../inputs/update-requirement-fulfillment.input';
import type { RequirementEntity } from '../schemas/requirement.schema';
import type { RequirementFulfillmentEntity } from '../schemas/requirement-fulfillment.schema';
import { RequirementService } from './requirement.service';
import type { OrganizationUserProfileEntity } from '../schemas/organization-user-profile.schema';
import type { DocumentEntity } from '../schemas/document.schema';

@Injectable()
export class RequirementFulfillmentService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly userService: UserService,
    private readonly requirementService: RequirementService,
  ) {}

  async findById(
    id: string,
  ): Promise<RequirementFulfillmentEntity | undefined> {
    return this.db.query.requirementFulfillments.findFirst({
      where: { id },
    });
  }

  async findAll(
    pagination: PaginationInput,
  ): Promise<{ items: RequirementFulfillmentEntity[]; total: number }> {
    const items = await this.db.query.requirementFulfillments.findMany({
      limit: pagination.limit,
      offset: pagination.offset,
      orderBy: { createdAt: 'desc' },
    });
    const [{ total }] = await this.db.query.requirementFulfillments.findMany({
      columns: {},
      extras: { total: count() },
    });
    return { items, total };
  }

  async create(
    input: CreateRequirementFulfillmentInput,
  ): Promise<RequirementFulfillmentEntity> {
    const [fulfillment] = await this.db
      .insert(schema.requirementFulfillments)
      .values(input)
      .returning();
    return fulfillment;
  }

  async update(
    id: string,
    input: UpdateRequirementFulfillmentInput,
    reviewerId?: string,
  ): Promise<RequirementFulfillmentEntity> {
    const [fulfillment] = await this.db
      .update(schema.requirementFulfillments)
      .set({
        ...input,
        ...(reviewerId ? { reviewerId, reviewedAt: new Date() } : {}),
      })
      .where(eq(schema.requirementFulfillments.id, id))
      .returning();

    if (!fulfillment) {
      throw new NotFoundGraphQLError('Requirement fulfillment not found');
    }

    return fulfillment;
  }

  async delete(id: string): Promise<RequirementFulfillmentEntity> {
    const [fulfillment] = await this.db
      .delete(schema.requirementFulfillments)
      .where(eq(schema.requirementFulfillments.id, id))
      .returning();
    if (!fulfillment) {
      throw new NotFoundGraphQLError('Requirement fulfillment not found');
    }
    return fulfillment;
  }

  async findRequirement(requirementId: string): Promise<RequirementEntity> {
    const requirement = await this.requirementService.findById(requirementId);
    if (!requirement) {
      throw new NotFoundGraphQLError('Requirement not found');
    }
    return requirement;
  }

  async findReviewerById(id: string | null): Promise<UserEntity | null> {
    if (!id) {
      return null;
    }
    const reviewer = await this.userService.findById(id);
    return reviewer ?? null;
  }

  async findProfileById(
    id: string,
  ): Promise<OrganizationUserProfileEntity | null> {
    const profile = await this.db.query.organizationUserProfiles.findFirst({
      where: { id },
    });
    return profile ?? null;
  }

  async findDocumentById(id: string): Promise<DocumentEntity | null> {
    const document = await this.db.query.documents.findFirst({
      where: { id },
    });
    return document ?? null;
  }
}
