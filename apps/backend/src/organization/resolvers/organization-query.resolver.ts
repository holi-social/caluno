import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { PaginationInput } from '../../graphql/pagination.input';
import {
  Organization,
  OrganizationPaginatedResponse,
} from '../models/organization.model';
import { OrganizationService } from '../organization.service';

@Resolver(() => Organization)
export class OrganizationQueryResolver {
  constructor(private readonly organizationService: OrganizationService) {}

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
    @Context() context: any,
  ): Promise<OrganizationPaginatedResponse> {
    const user = context.req.user;
    return this.organizationService.findAll(pagination, user.id);
  }
}
