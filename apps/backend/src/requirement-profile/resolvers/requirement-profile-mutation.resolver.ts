import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
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

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_CREATE)
  @Mutation(() => RequirementProfile)
  async createRequirementProfile(
    @Args('input') input: CreateRequirementProfileInput,
  ): Promise<RequirementProfile> {
    const item = await this.requirementProfileService.create(input);
    return this.requirementProfileMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_UPDATE)
  @Mutation(() => RequirementProfile)
  async updateRequirementProfile(
    @Args('id') id: string,
    @Args('input') input: UpdateRequirementProfileInput,
  ): Promise<RequirementProfile> {
    const item = await this.requirementProfileService.update(id, input);
    return this.requirementProfileMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_DELETE)
  @Mutation(() => RequirementProfile)
  async deleteRequirementProfile(
    @Args('id') id: string,
  ): Promise<RequirementProfile> {
    const item = await this.requirementProfileService.delete(id);
    return this.requirementProfileMapper.toModelOrThrow(item);
  }
}
