import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Session } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CreateOrganizationInput } from '../inputs/create-organization.input';
import { UpdateOrganizationInput } from '../inputs/update-organization.input';
import { Organization } from '../models/organization.model';
import { OrganizationService } from '../organization.service';

@Resolver(() => Organization)
export class OrganizationMutationResolver {
  constructor(private readonly organizationService: OrganizationService) {}

  @Mutation(() => Organization)
  async createOrganization(
    @Args('input') input: CreateOrganizationInput,
    @Session() session: UserSession,
  ): Promise<Organization> {
    return this.organizationService.create(session.user.id, input);
  }

  @Permissions(PERMISSIONS.ORG_EDIT)
  @Mutation(() => Organization)
  async updateOrganization(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateOrganizationInput,
  ): Promise<Organization> {
    return this.organizationService.update(id, input);
  }
}
