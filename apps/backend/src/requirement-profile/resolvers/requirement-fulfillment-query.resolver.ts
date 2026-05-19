import { Args, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { PaginationInput } from '../../graphql/pagination.input';
import { RequirementFulfillmentMapper } from '../mappers/requirement-fulfillment.mapper';
import {
  RequirementFulfillment,
  RequirementFulfillmentPaginatedResponse,
} from '../models/requirement-fulfillment.model';
import { RequirementProfileSubmissionService } from '../services';

@Resolver(() => RequirementFulfillment)
export class RequirementFulfillmentQueryResolver {
  constructor(
    private readonly requirementProfileSubmissionService: RequirementProfileSubmissionService,
    private readonly requirementFulfillmentMapper: RequirementFulfillmentMapper,
  ) {}

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_VIEW)
  @Query(() => RequirementFulfillment, { nullable: true })
  async requirementFulfillment(
    @Args('id') id: string,
  ): Promise<RequirementFulfillment | null> {
    const item =
      await this.requirementProfileSubmissionService.findFulfillmentById(id);
    return this.requirementFulfillmentMapper.toModel(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_VIEW)
  @Query(() => RequirementFulfillmentPaginatedResponse)
  async requirementFulfillments(
    @Args() pagination: PaginationInput,
  ): Promise<RequirementFulfillmentPaginatedResponse> {
    const { items, total } =
      await this.requirementProfileSubmissionService.findAllFulfillments(
        pagination,
      );
    return new RequirementFulfillmentPaginatedResponse({
      items: this.requirementFulfillmentMapper.toArray(items),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
