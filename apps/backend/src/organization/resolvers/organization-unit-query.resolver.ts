import { Args, Context, ID, Query, Resolver } from '@nestjs/graphql';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { NotFoundGraphQLError } from '../../graphql/errors/not-found.error';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { PaginationInput } from '../../graphql/pagination.input';
import { OrganizationUnitMapper } from '../mappers/organization-unit.mapper';
import { OrganizationUnitTypeMapper } from '../mappers/organization-unit-type.mapper';
import {
  OrganizationUnit,
  OrganizationUnitPaginatedResponse,
} from '../models/organization-unit.model';
import { OrganizationUnitType } from '../models/organization-unit-type.model';
import { OrganizationService } from '../organization.service';
import { OrganizationUnitService } from '../organization-unit.service';

@Resolver(() => OrganizationUnit)
export class OrganizationUnitQueryResolver {
  constructor(
    private readonly organizationUnitService: OrganizationUnitService,
    private readonly organizationService: OrganizationService,
    private readonly organizationUnitMapper: OrganizationUnitMapper,
    private readonly organizationUnitTypeMapper: OrganizationUnitTypeMapper,
  ) {}

  @Query(() => [OrganizationUnit])
  async myOrganizationUnits(
    @Session() session: UserSession,
  ): Promise<OrganizationUnit[]> {
    const units = await this.organizationService.findUnits(session.user.id);
    return this.organizationUnitMapper.toArray(units);
  }

  @Query(() => [OrganizationUnit])
  async myAdminstableOrganizationUnits(
    @Session() session: UserSession,
  ): Promise<OrganizationUnit[]> {
    const units = await this.organizationService.findAdministrableUnits(
      session.user.id,
    );
    return this.organizationUnitMapper.toArray(units);
  }

  @Query(() => [OrganizationUnit])
  async myCheckInAdministrableOrganizationUnits(
    @Session() session: UserSession,
  ): Promise<OrganizationUnit[]> {
    const units = await this.organizationService.findUnitsWithPermission(
      session.user.id,
      PERMISSIONS.CHECK_IN_MANAGE,
    );
    return this.organizationUnitMapper.toArray(units);
  }

  @Query(() => OrganizationUnit, { nullable: true })
  async organizationUnit(
    @Args('id') id: string,
  ): Promise<OrganizationUnit | null> {
    const organizationUnit = await this.organizationUnitService.findById(id);
    return this.organizationUnitMapper.toModel(organizationUnit);
  }

  @AllowAnonymous()
  @Query(() => OrganizationUnit)
  async publicOrganizationUnit(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<OrganizationUnit> {
    const organizationUnit = await this.organizationUnitService.findById(id);
    if (!organizationUnit || organizationUnit.deletedAt) {
      throw new NotFoundGraphQLError(
        `Organization unit with ID ${id} not found`,
      );
    }
    return this.organizationUnitMapper.toModelOrThrow(organizationUnit);
  }

  @Permissions(PERMISSIONS.ORG_VIEW)
  @Query(() => OrganizationUnit, { nullable: true })
  async organizationUnitBySlug(
    @Args('slug') slug: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<OrganizationUnit | null> {
    const organizationUnit =
      await this.organizationUnitService.findBySlug(slug);
    return this.organizationUnitMapper.toModel(organizationUnit);
  }

  @Permissions(PERMISSIONS.ORG_VIEW)
  @Query(() => [OrganizationUnitType])
  async organizationUnitTypes(
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<OrganizationUnitType[]> {
    const organizationId =
      await this.organizationUnitService.findOrganizationIdByUnitId(
        context.organizationUnitId,
      );

    if (!organizationId) {
      return [];
    }

    const types =
      await this.organizationUnitService.findAllTypes(organizationId);
    return this.organizationUnitTypeMapper.toArray(types);
  }

  @Permissions(PERMISSIONS.ORG_VIEW)
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
