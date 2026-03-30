import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { CreateOrganizationUnitInput } from '../inputs/create-organization-unit.input';
import { UpdateOrganizationUnitInput } from '../inputs/update-organization-unit.input';
import { OrganizationUnitMapper } from '../mappers/organization-unit.mapper';
import { OrganizationUnit } from '../models/organization-unit.model';
import { OrganizationUnitService } from '../organization-unit.service';

@Resolver(() => OrganizationUnit)
export class OrganizationUnitMutationResolver {
  constructor(
    private readonly organizationUnitService: OrganizationUnitService,
    private readonly organizationUnitMapper: OrganizationUnitMapper,
  ) {}

  @Permissions(PERMISSIONS.ORG_UNIT_CREATE)
  @Mutation(() => OrganizationUnit)
  async createOrganizationUnit(
    @Args('input') input: CreateOrganizationUnitInput,
  ): Promise<OrganizationUnit> {
    const organizationUnit = await this.organizationUnitService.create(
      input,
    );
    return this.organizationUnitMapper.toModelOrThrow(organizationUnit);
  }

  @Permissions(PERMISSIONS.ORG_UNIT_UPDATE)
  @Mutation(() => OrganizationUnit)
  async updateOrganizationUnit(
    @Args('id') id: string,
    @Args('input') input: UpdateOrganizationUnitInput,
  ): Promise<OrganizationUnit> {
    const organizationUnit = await this.organizationUnitService.update(
      id,
      input,
    );
    return this.organizationUnitMapper.toModelOrThrow(organizationUnit);
  }

  @Permissions(PERMISSIONS.ORG_UNIT_DELETE)
  @Mutation(() => OrganizationUnit)
  async deleteOrganizationUnit(
    @Args('id') id: string,
  ): Promise<OrganizationUnit> {
    const organizationUnit = await this.organizationUnitService.delete(
      id,
    );
    return this.organizationUnitMapper.toModelOrThrow(organizationUnit);
  }
}
