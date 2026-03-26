import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { MembershipService } from '../../membership/membership.service';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { Organization } from '../models/organization.model';
import { OrganizationService } from '../organization.service';

@Resolver(() => Organization)
export class OrganizationFieldResolver {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly membershipService: MembershipService,
    private readonly userMapper: UserMapper,
  ) {}

  @Permissions(PERMISSIONS.ORG_READ)
  @ResolveField(() => [Organization])
  async children(
    @Parent() organization: Organization,
  ): Promise<Organization[]> {
    return this.organizationService.findChildren(organization.id);
  }

  @Permissions(PERMISSIONS.ORG_READ)
  @ResolveField(() => Organization)
  async parent(
    @Parent() organization: Organization,
  ): Promise<Organization | null> {
    return this.organizationService.findParent(organization.id);
  }

  @Permissions(PERMISSIONS.MEMBERSHIP_READ)
  @ResolveField(() => [User])
  async volunteers(@Parent() organization: Organization): Promise<User[]> {
    const volunteers = await this.membershipService.getMembers(organization.id);
    return this.userMapper.toArray(volunteers);
  }
}
