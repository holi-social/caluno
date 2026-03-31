import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { PaginationInput } from '../../graphql/pagination.input';
import { OrganizationUnitMapper } from '../mappers/organization-unit.mapper';
import {
  OrganizationUnit,
  OrganizationUnitPaginatedResponse,
} from '../models/organization-unit.model';
import { OrganizationUnitService } from '../organization-unit.service';

@Resolver(() => OrganizationUnit)
export class OrganizationUnitQueryResolver {
  constructor(
    private readonly organizationUnitService: OrganizationUnitService,
    private readonly organizationUnitMapper: OrganizationUnitMapper,
  ) {}

  @Permissions(PERMISSIONS.ORG_UNIT_READ)
  @Query(() => OrganizationUnit, { nullable: true })
  async organizationUnit(
    @Args('id') id: string,
  ): Promise<OrganizationUnit | null> {
    const organizationUnit =
      await this.organizationUnitService.findById(
        id,
      );
    return this.organizationUnitMapper.toModel(organizationUnit);
  }

  @Permissions(PERMISSIONS.ORG_UNIT_READ)
  @Query(() => OrganizationUnit, { nullable: true })
  async organizationUnitBySlug(
    @Args('slug') slug: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<OrganizationUnit | null> {
    const organizationUnit = await this.organizationUnitService.findBySlug(
      slug,
    );
    return this.organizationUnitMapper.toModel(organizationUnit);
  }


  @Permissions(PERMISSIONS.ORG_UNIT_READ)
  @Query(() => OrganizationUnitPaginatedResponse)
  async organizationUnits(
    @Args() pagination: PaginationInput,
    @Args('organizationId') organizationId: string,
  ): Promise<OrganizationUnitPaginatedResponse> {
    const { items, total } = await this.organizationUnitService.findAll(
      organizationId,
      pagination,
    );

    return new OrganizationUnitPaginatedResponse({
      items: this.organizationUnitMapper.toArray(items),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
