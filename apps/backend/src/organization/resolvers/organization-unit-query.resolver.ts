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
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<OrganizationUnit | null> {
    const organizationUnit =
      await this.organizationUnitService.findByOrganizationId(
        id,
        context.organizationId,
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
      context.organizationId,
    );
    return this.organizationUnitMapper.toModel(organizationUnit);
  }

  @Permissions(PERMISSIONS.ORG_UNIT_READ)
  @Query(() => OrganizationUnit, { nullable: true })
  async organizationRootUnit(
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<OrganizationUnit | null> {
    const rootUnit =
      await this.organizationUnitService.findRootByOrganizationId(
        context.organizationId,
      );
    return this.organizationUnitMapper.toModel(rootUnit);
  }

  @Permissions(PERMISSIONS.ORG_UNIT_READ)
  @Query(() => OrganizationUnitPaginatedResponse)
  async organizationUnits(
    @Args() pagination: PaginationInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<OrganizationUnitPaginatedResponse> {
    const { items, total } = await this.organizationUnitService.findAll(
      context.organizationId,
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
