import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { CreateRequirementProfileInput } from '../inputs/create-requirement-profile.input';
import { UpdateRequirementProfileInput } from '../inputs/update-requirement-profile.input';
import { RequirementProfileMapper } from '../mappers/requirement-profile.mapper';
import { RequirementProfile } from '../models/requirement-profile.model';
import { RequirementProfileService } from '../services';

@Resolver(() => RequirementProfile)
export class RequirementProfileMutationResolver {
  constructor(
    private readonly requirementProfileService: RequirementProfileService,
    private readonly requirementProfileMapper: RequirementProfileMapper,
  ) {}

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => RequirementProfile)
  async createRequirementProfile(
    @Args('input') input: CreateRequirementProfileInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<RequirementProfile> {
    const item = await this.requirementProfileService.create(
      input,
      context.organizationUnitId,
      context.user.id,
    );
    return this.requirementProfileMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => RequirementProfile)
  async updateRequirementProfile(
    @Args('id') id: string,
    @Args('input') input: UpdateRequirementProfileInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<RequirementProfile> {
    const item = await this.requirementProfileService.update(
      id,
      context.organizationUnitId,
      input,
      context.user.id,
    );
    return this.requirementProfileMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => RequirementProfile)
  async deleteRequirementProfile(
    @Args('id') id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<RequirementProfile> {
    const item = await this.requirementProfileService.delete(
      id,
      context.organizationUnitId,
      context.user.id,
    );
    return this.requirementProfileMapper.toModelOrThrow(item);
  }
}
