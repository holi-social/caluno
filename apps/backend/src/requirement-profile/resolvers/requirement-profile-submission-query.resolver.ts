import { Args, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { PaginationInput } from '../../graphql/pagination.input';
import { RequirementProfileSubmissionMapper } from '../mappers/requirement-profile-submission.mapper';
import {
  RequirementProfileSubmission,
  RequirementProfileSubmissionPaginatedResponse,
} from '../models/requirement-profile-submission.model';
import { RequirementProfileSubmissionService } from '../services';

@Resolver(() => RequirementProfileSubmission)
export class RequirementProfileSubmissionQueryResolver {
  constructor(
    private readonly requirementProfileSubmissionService: RequirementProfileSubmissionService,
    private readonly requirementProfileSubmissionMapper: RequirementProfileSubmissionMapper,
  ) {}

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_SUBMISSION_READ)
  @Query(() => RequirementProfileSubmission, { nullable: true })
  async requirementProfileSubmission(
    @Args('id') id: string,
  ): Promise<RequirementProfileSubmission | null> {
    const item = await this.requirementProfileSubmissionService.findById(id);
    return this.requirementProfileSubmissionMapper.toModel(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_SUBMISSION_READ)
  @Query(() => RequirementProfileSubmissionPaginatedResponse)
  async requirementProfileSubmissions(
    @Args() pagination: PaginationInput,
  ): Promise<RequirementProfileSubmissionPaginatedResponse> {
    const { items, total } =
      await this.requirementProfileSubmissionService.findAll(pagination);
    return new RequirementProfileSubmissionPaginatedResponse({
      items: this.requirementProfileSubmissionMapper.toArray(items),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
