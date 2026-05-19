import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Loader } from '../../graphql/decorators';
import { OrganizationUnitMapper } from '../mappers/organization-unit.mapper';
import { Organization } from '../models/organization.model';
import { OrganizationUnit } from '../models/organization-unit.model';
import { OrganizationService } from '../organization.service';
import { OrganizationLoader } from './loader';

@Resolver(() => Organization)
export class OrganizationFieldResolver {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly organizationUnitMapper: OrganizationUnitMapper,
  ) {}

  @ResolveField(() => OrganizationUnit)
  async root(@Parent() organization: Organization): Promise<OrganizationUnit> {
    const rootUnit = await this.organizationService.findRootUnit(
      organization.id,
    );
    return this.organizationUnitMapper.toModelOrThrow(rootUnit);
  }

  @ResolveField(() => [OrganizationUnit])
  async units(
    @Parent() organization: Organization,
    @Loader(OrganizationLoader) loader: OrganizationLoader,
  ): Promise<OrganizationUnit[]> {
    return loader.unitsByOrgId.load(organization.id);
  }
}
