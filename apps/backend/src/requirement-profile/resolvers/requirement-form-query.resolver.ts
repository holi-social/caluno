import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { PaginationInput } from '../../graphql/pagination.input';
import { OrgAccessService } from '../../shared/org-access.service';
import { RequirementFormMapper } from '../mappers/requirement-form.mapper';
import {
  RequirementForm,
  RequirementFormPaginatedResponse,
} from '../models/requirement-form.model';
import { RequirementFormService } from '../services';

@Resolver(() => RequirementForm)
export class RequirementFormQueryResolver {
  constructor(
    private readonly requirementFormService: RequirementFormService,
    private readonly requirementFormMapper: RequirementFormMapper,
    private readonly orgAccessService: OrgAccessService,
  ) {}

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_VIEW)
  @Query(() => RequirementForm, { nullable: true })
  async requirementForm(
    @Args('id') id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<RequirementForm | null> {
    const item = await this.requirementFormService.findById(id);
    if (item) {
      await this.orgAccessService.verifyUnitInOrg(
        context.organizationUnitId,
        item.organizationId,
      );
    }
    return this.requirementFormMapper.toModel(item);
  }

  @AllowAnonymous()
  @Query(() => RequirementForm, { nullable: true })
  async requirementFormByShareToken(
    @Args('token') token: string,
  ): Promise<RequirementForm | null> {
    const item = await this.requirementFormService.findByShareToken(token);
    return this.requirementFormMapper.toModel(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_VIEW)
  @Query(() => RequirementFormPaginatedResponse)
  async requirementForms(
    @Args('organizationId') organizationId: string,
    @Args() pagination: PaginationInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<RequirementFormPaginatedResponse> {
    await this.orgAccessService.verifyUnitInOrg(
      context.organizationUnitId,
      organizationId,
    );
    const { items, total } = await this.requirementFormService.findAll(
      organizationId,
      pagination,
    );
    return new RequirementFormPaginatedResponse({
      items: this.requirementFormMapper.toArray(items),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
