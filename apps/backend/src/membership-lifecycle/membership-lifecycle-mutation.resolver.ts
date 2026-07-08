import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../auth/constants';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ForbiddenGraphQLError } from '../graphql/errors';
import { type AuthenticatedGraphQLContext } from '../graphql/graphql.context';
import { MembershipRequestMapper } from '../membership/mappers/membership-request.mepper';
import { MembershipService } from '../membership/membership.service';
import { MembershipRequest } from '../membership/models/membership-request.model';
import { SubmitFormInput } from '../requirement-profile/inputs/submit-form.input';
import { FormSubmissionMapper } from '../requirement-profile/mappers/form-submission.mapper';
import { FormSubmission } from '../requirement-profile/models/form-submission.model';
import { MembershipLifecycleOrchestrator } from './membership-lifecycle.orchestrator';

@Resolver()
export class MembershipLifecycleMutationResolver {
  constructor(
    private readonly membershipLifecycleOrchestrator: MembershipLifecycleOrchestrator,
    private readonly membershipService: MembershipService,
    private readonly membershipRequestMapper: MembershipRequestMapper,
    private readonly formSubmissionMapper: FormSubmissionMapper,
  ) {}

  @Permissions(PERMISSIONS.VOLUNTEER_EDIT)
  @Mutation(() => MembershipRequest)
  async approveMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('organizationUnitId', { type: () => ID }) organizationUnitId: string,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<MembershipRequest> {
    if (organizationUnitId !== context.organizationUnitId) {
      throw new ForbiddenGraphQLError(
        'Organization unit ID does not match the current context',
      );
    }
    const entity =
      await this.membershipLifecycleOrchestrator.approveMembershipRequest(
        id,
        organizationUnitId,
        session.user.id,
      );
    return this.membershipRequestMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.VOLUNTEER_EDIT)
  @Mutation(() => MembershipRequest)
  async rejectMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('organizationUnitId', { type: () => ID }) organizationUnitId: string,
    @Args('rejectionReason', { type: () => String }) rejectionReason: string,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<MembershipRequest> {
    if (organizationUnitId !== context.organizationUnitId) {
      throw new ForbiddenGraphQLError(
        'Organization unit ID does not match the current context',
      );
    }
    const entity =
      await this.membershipLifecycleOrchestrator.rejectMembershipRequest(
        id,
        organizationUnitId,
        session.user.id,
        rejectionReason,
      );
    return this.membershipRequestMapper.toModelOrThrow(entity);
  }

  @Mutation(() => FormSubmission)
  async submitForm(
    @Args('token') token: string,
    @Args('input') input: SubmitFormInput,
    @Session() session: UserSession,
  ): Promise<FormSubmission> {
    const item = await this.membershipLifecycleOrchestrator.submitForm(
      token,
      input,
      session.user.id,
    );
    return this.formSubmissionMapper.toModelOrThrow(item);
  }

  @Mutation(() => MembershipRequest)
  async cancelMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('organizationUnitId', { type: () => ID }) organizationUnitId: string,
    @Session() session: UserSession,
  ): Promise<MembershipRequest> {
    const entity = await this.membershipService.cancelMembershipRequest(
      id,
      organizationUnitId,
      session.user.id,
    );
    return this.membershipRequestMapper.toModelOrThrow(entity);
  }
}
