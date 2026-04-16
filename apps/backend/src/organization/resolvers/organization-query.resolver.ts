import { Args, Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { PaginationInput } from '../../graphql/pagination.input';
import { OrganizationMapper } from '../mappers/organization.mapper';
import {
  Organization,
  OrganizationPaginatedResponse,
} from '../models/organization.model';
import { OrganizationService } from '../organization.service';

@Resolver(() => Organization)
export class OrganizationQueryResolver {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly organizationMapper: OrganizationMapper,
  ) {}

  @Permissions(PERMISSIONS.ORG_READ)
  @Query(() => Organization, { nullable: true })
  async organization(@Args('id') id: string): Promise<Organization | null> {
    const orgEntity = await this.organizationService.findById(id);
    return this.organizationMapper.toModel(orgEntity);
  }

  @Permissions(PERMISSIONS.ORG_READ)
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
}
