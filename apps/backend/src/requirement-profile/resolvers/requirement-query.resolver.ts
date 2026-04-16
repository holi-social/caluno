import { Args, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { PaginationInput } from '../../graphql/pagination.input';
import { RequirementMapper } from '../mappers/requirement.mapper';
import {
  Requirement,
  RequirementPaginatedResponse,
} from '../models/requirement.model';
import { RequirementService } from '../services';

@Resolver(() => Requirement)
export class RequirementQueryResolver {
  constructor(
    private readonly requirementService: RequirementService,
    private readonly requirementMapper: RequirementMapper,
  ) {}

  @Permissions(PERMISSIONS.REQUIREMENT_READ)
  @Query(() => Requirement, { nullable: true })
  async requirement(@Args('id') id: string): Promise<Requirement | null> {
    const item = await this.requirementService.findById(id);
    return this.requirementMapper.toModel(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_READ)
  @Query(() => RequirementPaginatedResponse)
  async requirements(
    @Args() pagination: PaginationInput,
  ): Promise<RequirementPaginatedResponse> {
    const { items, total } = await this.requirementService.findAll(pagination);
    return new RequirementPaginatedResponse({
      items: this.requirementMapper.toArray(items),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
