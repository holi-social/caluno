import { Args, Query, Resolver } from '@nestjs/graphql';
import { PaginationInput } from '../../graphql/pagination.input';
import { OrganizationUnitMapper } from '../mappers/organization-unit.mapper';
import { OrganizationUnitTypeMapper } from '../mappers/organization-unit-type.mapper';
import {
  OrganizationUnit,
  OrganizationUnitPaginatedResponse,
} from '../models/organization-unit.model';
import { OrganizationUnitType } from '../models/organization-unit-type.model';
import { OrganizationUnitService } from '../organization-unit.service';

@Resolver(() => OrganizationUnit)
export class OrganizationUnitQueryResolver {
  constructor(
    private readonly organizationUnitService: OrganizationUnitService,
    private readonly organizationUnitMapper: OrganizationUnitMapper,
    private readonly organizationUnitTypeMapper: OrganizationUnitTypeMapper,
  ) {}

  @Query(() => OrganizationUnit, { nullable: true })
  async organizationUnit(
    @Args('id') id: string,
  ): Promise<OrganizationUnit | null> {
    const organizationUnit = await this.organizationUnitService.findById(id);
    return this.organizationUnitMapper.toModel(organizationUnit);
  }

  @Query(() => OrganizationUnit, { nullable: true })
  async organizationUnitBySlug(
    @Args('slug') slug: string,
  ): Promise<OrganizationUnit | null> {
    const organizationUnit =
      await this.organizationUnitService.findBySlug(slug);
    return this.organizationUnitMapper.toModel(organizationUnit);
  }

  @Query(() => [OrganizationUnitType])
  async organizationUnitTypes(): Promise<OrganizationUnitType[]> {
    const types = await this.organizationUnitService.findAllTypes();
    return this.organizationUnitTypeMapper.toArray(types);
  }

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
