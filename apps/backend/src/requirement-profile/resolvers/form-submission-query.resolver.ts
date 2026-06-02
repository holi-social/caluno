import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
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

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_VIEW)
  @Query(() => FormSubmission, { nullable: true })
  async formSubmission(
    @Args('id') id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<FormSubmission | null> {
    const item = await this.formSubmissionService.findById(id);
    if (item) {
      const form = await this.requirementFormService.findById(item.formId);
      if (form) {
        await this.orgAccessService.verifyUnitInOrg(
          context.organizationUnitId,
          form.organizationId,
        );
      }
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
    if (form) {
      await this.orgAccessService.verifyUnitInOrg(
        context.organizationUnitId,
        form.organizationId,
      );
    }
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
