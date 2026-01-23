import { Args, Mutation, Resolver } from '@nestjs/graphql';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Session } from '@thallesp/nestjs-better-auth';
import { CreateOrganizationInput } from '../inputs/create-organization.input';
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
}
