import { Args, Query, Resolver } from '@nestjs/graphql';
import { PaginationInput } from '../../graphql/pagination.input';
import {
    Opportunity,
    OpportunityPaginatedResponse,
} from '../models/opportunity.model';
import { OpportunityService } from '../opportunity.service';

@Resolver(() => Opportunity)
export class OpportunityQueryResolver {
    constructor(private readonly opportunityService: OpportunityService) {}

    @Query(() => Opportunity)
    async opportunity(@Args('id') id: string): Promise<Opportunity | null> {
        return this.opportunityService.findById(id);
    }

    @Query(() => OpportunityPaginatedResponse)
    async opportunities(
        @Args('organizationId') organizationId: string,
        @Args() pagination: PaginationInput,
    ): Promise<OpportunityPaginatedResponse> {
        return this.opportunityService.findAllByOrganizationId(
            organizationId,
            pagination,
        );
    }
}
