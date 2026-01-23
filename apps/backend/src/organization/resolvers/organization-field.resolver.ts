import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PaginationInput } from '../../graphql/pagination.input';
import {
    Opportunity,
    OpportunityPaginatedResponse,
} from '../../opportunity/models/opportunity.model';
import { User } from '../../user/models/user.model';
import { Organization } from '../models/organization.model';
import { OrganizationService } from '../organization.service';
import type { OrganizationEntity } from '../schemas/organization.schema';

@Resolver(() => Organization)
export class OrganizationFieldResolver {
    constructor(private readonly organizationService: OrganizationService) {}

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

    @ResolveField(() => User)
    async owner(@Parent() organization: OrganizationEntity): Promise<User> {
        return this.organizationService.findOwner(organization.ownerId);
    }

    @ResolveField(() => [Opportunity])
    async opportunities(
        @Parent() organization: Organization,
        @Args() pagination: PaginationInput,
    ): Promise<OpportunityPaginatedResponse> {
        return this.organizationService.findOpportunities(
            organization.id,
            pagination,
        );
    }

    @ResolveField(() => [User])
    async admins(@Parent() organization: Organization): Promise<User[]> {
        return this.organizationService.findAdmins(organization.id);
    }

    @ResolveField(() => [User])
    async moderators(@Parent() organization: Organization): Promise<User[]> {
        return this.organizationService.findModerators(organization.id);
    }

    @ResolveField(() => [User])
    async volunteers(@Parent() organization: Organization): Promise<User[]> {
        return this.organizationService.findVolunteers(organization.id);
    }
}
