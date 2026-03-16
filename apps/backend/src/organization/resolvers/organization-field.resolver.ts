import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { PaginationInput } from '../../graphql/pagination.input';
import {
  Project,
  type ProjectPaginatedResponse,
} from '../../project/models/project.model';
import { UserMapper } from '../../user/mappers/user.mapper';
import { Organization } from '../models/organization.model';
import { OrganizationService } from '../organization.service';

@Resolver(() => Organization)
export class OrganizationFieldResolver {
  constructor(
    private readonly organizationService: OrganizationService,
    readonly _userMapper: UserMapper,
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

  @Permissions(PERMISSIONS.PROJECT_READ)
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
}
