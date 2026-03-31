import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { OrganizationMapper } from '../mappers/organization.mapper';
import { OrganizationUnitMapper } from '../mappers/organization-unit.mapper';
import { OrganizationUnitTypeMapper } from '../mappers/organization-unit-type.mapper';
import { Organization } from '../models/organization.model';
import { OrganizationUnit } from '../models/organization-unit.model';
import { OrganizationUnitType } from '../models/organization-unit-type.model';
import { OrganizationUnitService } from '../organization-unit.service';
import type { OrganizationUnitEntity } from '../schemas/organization-unit.schema';

@Resolver(() => OrganizationUnit)
export class OrganizationUnitFieldResolver {
  constructor(
    private readonly organizationUnitService: OrganizationUnitService,
    private readonly organizationMapper: OrganizationMapper,
    private readonly organizationUnitMapper: OrganizationUnitMapper,
    private readonly organizationUnitTypeMapper: OrganizationUnitTypeMapper,
  ) {}

  @Permissions(PERMISSIONS.ORG_UNIT_READ)
  @ResolveField(() => Organization)
  async organization(
    @Parent() organizationUnit: OrganizationUnitEntity,
  ): Promise<Organization> {
    const organization = await this.organizationUnitService.findOrganization(
      organizationUnit.organizationId,
    );
    return this.organizationMapper.toModelOrThrow(organization);
  }

  @Permissions(PERMISSIONS.ORG_UNIT_READ)
  @ResolveField(() => OrganizationUnitType)
  async type(
    @Parent() organizationUnit: OrganizationUnitEntity,
  ): Promise<OrganizationUnitType> {
    const organizationUnitType = await this.organizationUnitService.findType(
      organizationUnit.typeId,
    );
    return this.organizationUnitTypeMapper.toModelOrThrow(organizationUnitType);
  }

  @Permissions(PERMISSIONS.ORG_UNIT_READ)
  @ResolveField(() => OrganizationUnit, { nullable: true })
  async parent(
    @Parent() organizationUnit: OrganizationUnitEntity,
  ): Promise<OrganizationUnit | null> {
    if (!organizationUnit.parentId) {
      return null;
    }

    const parent = await this.organizationUnitService.findParent(
      organizationUnit.parentId,
    );
    return this.organizationUnitMapper.toModel(parent);
  }

  @Permissions(PERMISSIONS.ORG_UNIT_READ)
  @ResolveField(() => [OrganizationUnit])
  async children(
    @Parent() organizationUnit: OrganizationUnitEntity,
  ): Promise<OrganizationUnit[]> {
    const children = await this.organizationUnitService.findChildren(
      organizationUnit.id,
    );
    return this.organizationUnitMapper.toArray(children);
  }
}
