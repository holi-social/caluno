import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { PaginationInput } from '../../graphql/pagination.input';
import { OrgAccessService } from '../../shared/org-access.service';
import { FormBlockMapper } from '../mappers/form-block.mapper';
import {
  FormBlock,
  FormBlockPaginatedResponse,
} from '../models/form-block.model';
import { FormBlockService } from '../services';

@Resolver(() => FormBlock)
export class FormBlockQueryResolver {
  constructor(
    private readonly formBlockService: FormBlockService,
    private readonly formBlockMapper: FormBlockMapper,
    private readonly orgAccessService: OrgAccessService,
  ) {}

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_VIEW)
  @Query(() => FormBlock, { nullable: true })
  async formBlock(
    @Args('id') id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<FormBlock | null> {
    const item = await this.formBlockService.findById(id);
    if (item) {
      await this.orgAccessService.verifyUnitInOrg(
        context.organizationUnitId,
        item.organizationId,
      );
    }
    return this.formBlockMapper.toModel(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_VIEW)
  @Query(() => FormBlockPaginatedResponse)
  async formBlocks(
    @Args('organizationId') organizationId: string,
    @Args() pagination: PaginationInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<FormBlockPaginatedResponse> {
    await this.orgAccessService.verifyUnitInOrg(
      context.organizationUnitId,
      organizationId,
    );
    const { items, total } = await this.formBlockService.findAll(
      organizationId,
      pagination,
    );
    return new FormBlockPaginatedResponse({
      items: this.formBlockMapper.toArray(items),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
