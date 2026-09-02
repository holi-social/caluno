import { Args, Context, ID, Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { NotFoundGraphQLError } from '../../graphql/errors';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { PaginationInput } from '../../graphql/pagination.input';
import { OrgAccessService } from '../../shared/org-access.service';
import { FormSubmissionMapper } from '../mappers/form-submission.mapper';
import {
  FormSubmission,
  FormSubmissionPaginatedResponse,
} from '../models/form-submission.model';
import { FormSubmissionService, RequirementFormService } from '../services';

@Resolver(() => FormSubmission)
export class FormSubmissionQueryResolver {
  constructor(
    private readonly formSubmissionService: FormSubmissionService,
    private readonly requirementFormService: RequirementFormService,
    private readonly formSubmissionMapper: FormSubmissionMapper,
    private readonly orgAccessService: OrgAccessService,
  ) {}

  @Query(() => FormSubmission, { nullable: true })
  async myFormSubmissionByToken(
    @Args('token') token: string,
    @Session() session: UserSession,
  ): Promise<FormSubmission | null> {
    const form = await this.requirementFormService.findByShareToken(token);
    if (!form) return null;
    const item = await this.formSubmissionService.findByUserAndForm(
      session.user.id,
      form.id,
    );
    return this.formSubmissionMapper.toModel(item);
  }

  @Query(() => [FormSubmission])
  async myFormSubmissions(
    @Args('organizationUnitId', { type: () => ID })
    organizationUnitId: string,
    @Session() session: UserSession,
  ): Promise<FormSubmission[]> {
    const items = await this.formSubmissionService.findByUserAndOrgUnit(
      session.user.id,
      organizationUnitId,
    );
    return this.formSubmissionMapper.toArray(items);
  }

  @Query(() => FormSubmission, { nullable: true })
  async myFormSubmission(
    @Args('id', { type: () => ID }) id: string,
    @Session() session: UserSession,
  ): Promise<FormSubmission | null> {
    const item = await this.formSubmissionService.findMySubmission(
      session.user.id,
      id,
    );
    return this.formSubmissionMapper.toModel(item);
  }

  @Permissions(PERMISSIONS.VOLUNTEER_VIEW)
  @Query(() => [FormSubmission])
  async formSubmissionsForVolunteer(
    @Args('userId') userId: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<FormSubmission[]> {
    const items = await this.formSubmissionService.findByUserForAdmin(
      userId,
      context.organizationUnitId,
    );
    return this.formSubmissionMapper.toArray(items);
  }

  @Permissions(PERMISSIONS.VOLUNTEER_VIEW)
  @Query(() => [FormSubmission])
  async formSubmissionsByMembershipRequest(
    @Args('membershipRequestId') membershipRequestId: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<FormSubmission[]> {
    const items =
      await this.formSubmissionService.findByMembershipRequestForAdmin(
        membershipRequestId,
        context.organizationUnitId,
      );
    return this.formSubmissionMapper.toArray(items);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_VIEW)
  @Query(() => FormSubmission, { nullable: true })
  async formSubmission(
    @Args('id') id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<FormSubmission | null> {
    return this.findOrgScopedSubmission(id, context.organizationUnitId);
  }

  @Permissions(PERMISSIONS.VOLUNTEER_VIEW)
  @Query(() => FormSubmission, { nullable: true })
  async adminVolunteerSubmission(
    @Args('id') id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<FormSubmission | null> {
    return this.findOrgScopedSubmission(id, context.organizationUnitId);
  }

  private async findOrgScopedSubmission(
    id: string,
    organizationUnitId: string,
  ): Promise<FormSubmission | null> {
    const item = await this.formSubmissionService.findById(id);
    if (item) {
      const form = await this.requirementFormService.findById(item.formId);
      if (!form) {
        throw new NotFoundGraphQLError('Form not found');
      }
      await this.orgAccessService.verifyUnitInOrg(
        organizationUnitId,
        form.organizationId,
      );
    }
    return this.formSubmissionMapper.toModel(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_VIEW)
  @Query(() => FormSubmissionPaginatedResponse)
  async formSubmissionsByForm(
    @Args('formId') formId: string,
    @Args() pagination: PaginationInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<FormSubmissionPaginatedResponse> {
    const form = await this.requirementFormService.findById(formId);
    if (!form) {
      throw new NotFoundGraphQLError('Form not found');
    }
    await this.orgAccessService.verifyUnitInOrg(
      context.organizationUnitId,
      form.organizationId,
    );
    const { items, total } = await this.formSubmissionService.findByFormId(
      formId,
      pagination,
    );
    return new FormSubmissionPaginatedResponse({
      items: this.formSubmissionMapper.toArray(items),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
