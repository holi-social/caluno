import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { PaginationInput } from '../../graphql/pagination.input';
import { OrganizationMapper } from '../mappers/organization.mapper';
import {
  Organization,
  OrganizationPaginatedResponse,
} from '../models/organization.model';
import { OrganizationTree } from '../models/organization-tree.model';
import { OrganizationService } from '../organization.service';

@Resolver(() => Organization)
export class OrganizationQueryResolver {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly organizationMapper: OrganizationMapper,
  ) {}

  @Permissions(PERMISSIONS.ORG_VIEW)
  @Query(() => Organization, { nullable: true })
  async organization(@Args('id') id: string): Promise<Organization | null> {
    const orgEntity = await this.organizationService.findById(id);
    return this.organizationMapper.toModel(orgEntity);
  }

  @Permissions(PERMISSIONS.ORG_VIEW)
  @Query(() => Organization)
  async organizationBySlug(
    @Args('slug') slug: string,
  ): Promise<Organization | null> {
    const orgEntity = await this.organizationService.findBySlug(slug);
    return this.organizationMapper.toModel(orgEntity);
  }

  @Query(() => OrganizationPaginatedResponse)
  async organizations(
    @Args() pagination: PaginationInput,
    @Session() session: UserSession,
  ): Promise<OrganizationPaginatedResponse> {
    const { items, total } = await this.organizationService.findAll(
      session.user.id,
      pagination,
    );
    return new OrganizationPaginatedResponse({
      items: this.organizationMapper.toArray(items),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  @Query(() => OrganizationTree, { nullable: true })
  async organizationTree(
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<OrganizationTree | null> {
    return this.organizationService.findOrganizationTree(
      session.user.id,
      context.organizationUnitId,
    );
  }
}
