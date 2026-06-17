import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { UserService } from '../../user/user.service';
import { FormSubmissionValueMapper } from '../mappers/form-submission-value.mapper';
import { RequirementFormMapper } from '../mappers/requirement-form.mapper';
import { FormSubmission } from '../models/form-submission.model';
import { FormSubmissionValue } from '../models/form-submission-value.model';
import { RequirementForm } from '../models/requirement-form.model';
import type { FormSubmissionEntity } from '../schemas/form-submission.schema';
import { FormSubmissionService, RequirementFormService } from '../services';

@Resolver(() => FormSubmission)
export class FormSubmissionFieldResolver {
  constructor(
    private readonly formSubmissionService: FormSubmissionService,
    private readonly formSubmissionValueMapper: FormSubmissionValueMapper,
    private readonly requirementFormService: RequirementFormService,
    private readonly requirementFormMapper: RequirementFormMapper,
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
  ) {}

  @ResolveField(() => [FormSubmissionValue], { nullable: true })
  async values(
    @Parent() submission: FormSubmission,
  ): Promise<FormSubmissionValue[]> {
    const values = await this.formSubmissionService.findValuesBySubmissionId(
      submission.id,
    );
    return this.formSubmissionValueMapper.toArray(values);
  }

  @ResolveField(() => RequirementForm, { nullable: true })
  async form(
    @Parent() submission: FormSubmissionEntity,
  ): Promise<RequirementForm | null> {
    const entity = await this.requirementFormService.findById(
      submission.formId,
    );
    return this.requirementFormMapper.toModel(entity);
  }

  @ResolveField(() => User, { nullable: true })
  async user(@Parent() submission: FormSubmissionEntity): Promise<User | null> {
    if (!submission.userId) return null;
    const entity = await this.userService.findById(submission.userId);
    if (!entity) return null;
    return this.userMapper.toModelOrThrow(entity);
  }
}
