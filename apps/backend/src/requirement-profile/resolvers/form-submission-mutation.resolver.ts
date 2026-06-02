import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { SubmitFormInput } from '../inputs/submit-form.input';
import { FormSubmissionMapper } from '../mappers/form-submission.mapper';
import { FormSubmission } from '../models/form-submission.model';
import { FormSubmissionService } from '../services';

@Resolver(() => FormSubmission)
export class FormSubmissionMutationResolver {
  constructor(
    private readonly formSubmissionService: FormSubmissionService,
    private readonly formSubmissionMapper: FormSubmissionMapper,
  ) {}

  @Mutation(() => FormSubmission)
  async submitForm(
    @Args('token') token: string,
    @Args('input') input: SubmitFormInput,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<FormSubmission> {
    const item = await this.formSubmissionService.submit(
      token,
      input,
      session.user.id,
    );
    return this.formSubmissionMapper.toModelOrThrow(item);
  }
}
