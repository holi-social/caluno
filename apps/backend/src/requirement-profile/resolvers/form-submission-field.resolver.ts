import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { FormSubmissionValueMapper } from '../mappers/form-submission-value.mapper';
import { FormSubmission } from '../models/form-submission.model';
import { FormSubmissionValue } from '../models/form-submission-value.model';
import { FormSubmissionService } from '../services';

@Resolver(() => FormSubmission)
export class FormSubmissionFieldResolver {
  constructor(
    private readonly formSubmissionService: FormSubmissionService,
    private readonly formSubmissionValueMapper: FormSubmissionValueMapper,
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
}
