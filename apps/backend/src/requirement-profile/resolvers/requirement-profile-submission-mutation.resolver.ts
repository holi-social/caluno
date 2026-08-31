import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CreateRequirementProfileSubmissionInput } from '../inputs/create-requirement-profile-submission.input';
import { UpdateRequirementProfileSubmissionInput } from '../inputs/update-requirement-profile-submission.input';
import { RequirementProfileSubmissionMapper } from '../mappers/requirement-profile-submission.mapper';
import { RequirementProfileSubmission } from '../models/requirement-profile-submission.model';
import { RequirementProfileSubmissionService } from '../services';

@Resolver(() => RequirementProfileSubmission)
export class RequirementProfileSubmissionMutationResolver {
  constructor(
    private readonly requirementProfileSubmissionService: RequirementProfileSubmissionService,
    private readonly requirementProfileSubmissionMapper: RequirementProfileSubmissionMapper,
  ) {}

  @Mutation(() => RequirementProfileSubmission)
  async createRequirementProfileSubmission(
    @Args('input') input: CreateRequirementProfileSubmissionInput,
    @Session() session: UserSession,
  ): Promise<RequirementProfileSubmission> {
    const item = await this.requirementProfileSubmissionService.create(
      input,
      session.user.id,
    );
    return this.requirementProfileSubmissionMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.VOLUNTEER_EDIT)
  @Mutation(() => RequirementProfileSubmission)
  async updateRequirementProfileSubmission(
    @Args('id') id: string,
    @Args('input') input: UpdateRequirementProfileSubmissionInput,
    @Session() session: UserSession,
  ): Promise<RequirementProfileSubmission> {
    const item = await this.requirementProfileSubmissionService.update(
      id,
      input,
      session.user.id,
    );
    return this.requirementProfileSubmissionMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.VOLUNTEER_EDIT)
  @Mutation(() => RequirementProfileSubmission)
  async deleteRequirementProfileSubmission(
    @Args('id') id: string,
    @Session() session: UserSession,
  ): Promise<RequirementProfileSubmission> {
    const item = await this.requirementProfileSubmissionService.delete(
      id,
      session.user.id,
    );
    return this.requirementProfileSubmissionMapper.toModelOrThrow(item);
  }
}
