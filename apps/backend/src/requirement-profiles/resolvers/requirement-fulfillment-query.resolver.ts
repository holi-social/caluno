import { Args, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { PaginationInput } from '../../graphql/pagination.input';
import { RequirementFulfillmentMapper } from '../mappers/requirement-fulfillment.mapper';
import {
  RequirementFulfillment,
  RequirementFulfillmentPaginatedResponse,
} from '../models/requirement-fulfillment.model';
import { RequirementFulfillmentService } from '../services';

@Resolver(() => RequirementFulfillment)
export class RequirementFulfillmentQueryResolver {
  constructor(
    private readonly requirementFulfillmentService: RequirementFulfillmentService,
    private readonly requirementFulfillmentMapper: RequirementFulfillmentMapper,
  ) {}

  @Permissions(PERMISSIONS.REQUIREMENT_FULFILLMENT_READ)
  @Query(() => RequirementFulfillment, { nullable: true })
  async requirementFulfillment(
    @Args('id') id: string,
  ): Promise<RequirementFulfillment | null> {
    const item = await this.requirementFulfillmentService.findById(id);
    return this.requirementFulfillmentMapper.toModel(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_FULFILLMENT_READ)
  @Query(() => RequirementFulfillmentPaginatedResponse)
  async requirementFulfillments(
    @Args() pagination: PaginationInput,
  ): Promise<RequirementFulfillmentPaginatedResponse> {
    const { items, total } =
      await this.requirementFulfillmentService.findAll(pagination);
    return new RequirementFulfillmentPaginatedResponse({
      items: this.requirementFulfillmentMapper.toArray(items),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
