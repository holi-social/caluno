import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { CreateRequirementFormInput } from '../inputs/create-requirement-form.input';
import { SubmitFormInput } from '../inputs/submit-form.input';
import { UpdateRequirementFormInput } from '../inputs/update-requirement-form.input';
import { RequirementFormMapper } from '../mappers/requirement-form.mapper';
import { FormSubmission } from '../models/form-submission.model';
import { RequirementForm } from '../models/requirement-form.model';
import { RequirementFormService } from '../services';
import { FormSubmissionService } from '../services/form-submission.service';

@Resolver(() => RequirementForm)
export class RequirementFormMutationResolver {
  constructor(
    private readonly requirementFormService: RequirementFormService,
    private readonly requirementFormMapper: RequirementFormMapper,
    private readonly formSubmissionService: FormSubmissionService,
  ) {}

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => RequirementForm)
  async createRequirementForm(
    @Args('input') input: CreateRequirementFormInput,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<RequirementForm> {
    const item = await this.requirementFormService.create(
      input,
      context.organizationUnitId,
      session.user.id,
    );
    return this.requirementFormMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => RequirementForm)
  async updateRequirementForm(
    @Args('id') id: string,
    @Args('input') input: UpdateRequirementFormInput,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<RequirementForm> {
    const item = await this.requirementFormService.update(
      id,
      context.organizationUnitId,
      input,
      session.user.id,
    );
    return this.requirementFormMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => RequirementForm)
  async deleteRequirementForm(
    @Args('id') id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<RequirementForm> {
    const item = await this.requirementFormService.delete(
      id,
      context.organizationUnitId,
    );
    return this.requirementFormMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => RequirementForm)
  async regenerateFormShareToken(
    @Args('id') id: string,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<RequirementForm> {
    const item = await this.requirementFormService.regenerateShareToken(
      id,
      context.organizationUnitId,
      session.user.id,
    );
    return this.requirementFormMapper.toModelOrThrow(item);
  }

  @Mutation(() => FormSubmission)
  async submitRequiredForm(
    @Args('organizationUnitId') organizationUnitId: string,
    @Args('formId') formId: string,
    @Args('input') input: SubmitFormInput,
    @Session() session: UserSession,
  ): Promise<FormSubmission> {
    const submission = await this.formSubmissionService.submitRequiredForm(
      organizationUnitId,
      formId,
      input,
      session.user.id,
    );
    return submission as unknown as FormSubmission;
  }
}
