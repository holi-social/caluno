import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { UpdateRequirementFulfillmentInput } from '../inputs/update-requirement-fulfillment.input';
import { RequirementFulfillmentMapper } from '../mappers/requirement-fulfillment.mapper';
import { RequirementFulfillment } from '../models/requirement-fulfillment.model';
import { RequirementFulfillmentService } from '../services';

@Resolver(() => RequirementFulfillment)
export class RequirementFulfillmentMutationResolver {
  constructor(
    private readonly requirementFulfillmentService: RequirementFulfillmentService,
    private readonly requirementFulfillmentMapper: RequirementFulfillmentMapper,
  ) {}

  @Permissions(PERMISSIONS.REQUIREMENT_FULFILLMENT_UPDATE)
  @Mutation(() => RequirementFulfillment)
  async updateRequirementFulfillment(
    @Args('id') id: string,
    @Args('input') input: UpdateRequirementFulfillmentInput,
    @Session() session: UserSession,
  ): Promise<RequirementFulfillment> {
    const item = await this.requirementFulfillmentService.update(
      id,
      input,
      session.user.id,
    );
    return this.requirementFulfillmentMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_FULFILLMENT_DELETE)
  @Mutation(() => RequirementFulfillment)
  async deleteRequirementFulfillment(
    @Args('id') id: string,
  ): Promise<RequirementFulfillment> {
    const item = await this.requirementFulfillmentService.delete(id);
    return this.requirementFulfillmentMapper.toModelOrThrow(item);
  }
}
