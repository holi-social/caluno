import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { UpdateRequirementFulfillmentInput } from '../inputs/update-requirement-fulfillment.input';
import { RequirementFulfillmentMapper } from '../mappers/requirement-fulfillment.mapper';
import { RequirementFulfillment } from '../models/requirement-fulfillment.model';
import { RequirementProfileSubmissionService } from '../services';

@Resolver(() => RequirementFulfillment)
export class RequirementFulfillmentMutationResolver {
  constructor(
    private readonly requirementProfileSubmissionService: RequirementProfileSubmissionService,
    private readonly requirementFulfillmentMapper: RequirementFulfillmentMapper,
  ) {}

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => RequirementFulfillment)
  async updateRequirementFulfillment(
    @Args('id') id: string,
    @Args('input') input: UpdateRequirementFulfillmentInput,
    @Session() session: UserSession,
  ): Promise<RequirementFulfillment> {
    const item =
      await this.requirementProfileSubmissionService.updateFulfillment(
        id,
        input,
        session.user.id,
      );
    return this.requirementFulfillmentMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => RequirementFulfillment)
  async deleteRequirementFulfillment(
    @Args('id') id: string,
  ): Promise<RequirementFulfillment> {
    const item =
      await this.requirementProfileSubmissionService.deleteFulfillment(id);
    return this.requirementFulfillmentMapper.toModelOrThrow(item);
  }
}
