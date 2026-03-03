import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PaginationInput } from '../../graphql/pagination.input';
import {
  Project,
  type ProjectPaginatedResponse,
} from '../../project/models/project.model';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { Organization } from '../models/organization.model';
import { OrganizationService } from '../organization.service';
import type { OrganizationEntity } from '../schemas/organization.schema';

@Resolver(() => Organization)
export class OrganizationFieldResolver {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly userMapper: UserMapper,
  ) {}

  @ResolveField(() => [Organization])
  async children(
    @Parent() organization: Organization,
  ): Promise<Organization[]> {
    return this.organizationService.findChildren(organization.id);
  }

  @ResolveField(() => Organization)
  async parent(
    @Parent() organization: Organization,
  ): Promise<Organization | null> {
    return this.organizationService.findParent(organization.id);
  }

  @ResolveField(() => [Project])
  async projects(
    @Parent() organization: Organization,
    @Args() pagination: PaginationInput,
  ): Promise<ProjectPaginatedResponse> {
    return this.organizationService.findProjectsByOrganizationId(
      organization.id,
      pagination,
    );
  }

  @ResolveField(() => [User])
  async admins(@Parent() organization: Organization): Promise<User[]> {
    const admins = await this.organizationService.findAdmins(organization.id);
    return this.userMapper.toArray(admins);
  }

  @ResolveField(() => [User])
  async volunteers(@Parent() organization: Organization): Promise<User[]> {
    const volunteers = await this.organizationService.findVolunteers(
      organization.id,
    );
    return this.userMapper.toArray(volunteers);
  }
}
