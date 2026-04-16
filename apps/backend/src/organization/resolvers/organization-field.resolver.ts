import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { MembershipService } from '../../membership/membership.service';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { OrganizationUnitMapper } from '../mappers/organization-unit.mapper';
import { Organization } from '../models/organization.model';
import { OrganizationUnit } from '../models/organization-unit.model';
import { OrganizationService } from '../organization.service';

@Resolver(() => Organization)
export class OrganizationFieldResolver {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly organizationUnitMapper: OrganizationUnitMapper,
    private readonly membershipService: MembershipService,
    private readonly userMapper: UserMapper,
  ) {}

  @Permissions(PERMISSIONS.ORG_READ)
  @ResolveField(() => OrganizationUnit)
  async root(@Parent() organization: Organization): Promise<OrganizationUnit> {
    const rootUnit = await this.organizationService.findRootUnit(
      organization.id,
    );
    return this.organizationUnitMapper.toModelOrThrow(rootUnit);
  }

  @Permissions(PERMISSIONS.ORG_READ)
  @ResolveField(() => [OrganizationUnit])
  async units(
    @Parent() organization: Organization,
  ): Promise<OrganizationUnit[]> {
    const childrenUnits = await this.organizationService.findChildrenUnits(
      organization.id,
    );
    return this.organizationUnitMapper.toArray(childrenUnits);
  }

  @Permissions(PERMISSIONS.ORG_READ)
  @ResolveField(() => [User])
  async volunteers(@Parent() organization: Organization): Promise<User[]> {
    const rootUnit = await this.organizationService.findRootUnit(
      organization.id,
    );
    if (!rootUnit) {
      throw new Error('Root unit not found for organization');
    }
    const members = await this.membershipService.getMembers(rootUnit.id);
    return this.userMapper.toArray(members);
  }
}
