import { Session } from '@nestjs/common';
import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { type UserSession } from '@thallesp/nestjs-better-auth';
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

  @Query(() => Organization)
  async organization(@Args('id') id: string): Promise<Organization | null> {
    return this.organizationService.findById(id);
  }

  @Query(() => Organization)
  async organizationBySlug(
    @Args('slug') slug: string,
  ): Promise<Organization | null> {
    return this.organizationService.findBySlug(slug);
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
