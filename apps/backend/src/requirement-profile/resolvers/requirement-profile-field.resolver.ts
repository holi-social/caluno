import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { RequirementMapper } from '../mappers/requirement.mapper';
import { Requirement } from '../models/requirement.model';
import { RequirementProfile } from '../models/requirement-profile.model';
import { RequirementProfileService } from '../services';

@Resolver(() => RequirementProfile)
export class RequirementProfileFieldResolver {
  constructor(
    private readonly requirementProfileService: RequirementProfileService,
    private readonly requirementMapper: RequirementMapper,
  ) {}

  @ResolveField(() => [Requirement], { nullable: true })
  async requirements(
    @Parent() profile: RequirementProfile,
  ): Promise<Requirement[]> {
    const entities = await this.requirementProfileService.findRequirements(
      profile.id,
    );
    return this.requirementMapper.toArray(entities);
  }
}
