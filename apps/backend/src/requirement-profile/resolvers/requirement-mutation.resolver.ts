import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { CreateRequirementInput } from '../inputs/create-requirement.input';
import { UpdateRequirementInput } from '../inputs/update-requirement.input';
import { RequirementMapper } from '../mappers/requirement.mapper';
import { Requirement } from '../models/requirement.model';
import { RequirementService } from '../services';

@Resolver(() => Requirement)
export class RequirementMutationResolver {
  constructor(
    private readonly requirementService: RequirementService,
    private readonly requirementMapper: RequirementMapper,
  ) {}

  @Permissions(PERMISSIONS.REQUIREMENT_CREATE)
  @Mutation(() => Requirement)
  async createRequirement(
    @Args('input') input: CreateRequirementInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Requirement> {
    const item = await this.requirementService.create(
      input,
      context.organizationUnitId,
    );
    return this.requirementMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_UPDATE)
  @Mutation(() => Requirement)
  async updateRequirement(
    @Args('id') id: string,
    @Args('input') input: UpdateRequirementInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Requirement> {
    const item = await this.requirementService.update(
      id,
      context.organizationUnitId,
      input,
    );
    return this.requirementMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_DELETE)
  @Mutation(() => Requirement)
  async deleteRequirement(
    @Args('id') id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Requirement> {
    const item = await this.requirementService.delete(
      id,
      context.organizationUnitId,
    );
    return this.requirementMapper.toModelOrThrow(item);
  }
}
