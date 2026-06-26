import { Args, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { PaginationInput } from '../../graphql/pagination.input';
import { RequirementProfileMapper } from '../mappers/requirement-profile.mapper';
import {
  RequirementProfile,
  RequirementProfilePaginatedResponse,
} from '../models/requirement-profile.model';
import { RequirementProfileService } from '../services';

@Resolver(() => RequirementProfile)
export class RequirementProfileQueryResolver {
  constructor(
    private readonly requirementProfileService: RequirementProfileService,
    private readonly requirementProfileMapper: RequirementProfileMapper,
  ) {}

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_VIEW)
  @Query(() => RequirementProfile, { nullable: true })
  async requirementProfile(
    @Args('id') id: string,
  ): Promise<RequirementProfile | null> {
    const item = await this.requirementProfileService.findById(id);
    return this.requirementProfileMapper.toModel(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_VIEW)
  @Query(() => RequirementProfilePaginatedResponse)
  async requirementProfiles(
    @Args() pagination: PaginationInput,
  ): Promise<RequirementProfilePaginatedResponse> {
    const { items, total } =
      await this.requirementProfileService.findAll(pagination);
    return new RequirementProfilePaginatedResponse({
      items: this.requirementProfileMapper.toArray(items),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
