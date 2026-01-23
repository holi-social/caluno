import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Task } from '../../task/models/task.model';
import { User } from '../../user/models/user.model';
import { Opportunity } from '../models/opportunity.model';
import { OpportunityService } from '../opportunity.service';
import type { OpportunityEntity } from '../schemas/opportunity.schema';

@Resolver(() => Opportunity)
export class OpportunityFieldResolver {
    constructor(private readonly opportunityService: OpportunityService) {}

    @ResolveField(() => User)
    async createdBy(@Parent() opportunity: OpportunityEntity): Promise<User> {
        return this.opportunityService.findCreator(opportunity.createdById);
    }

    @ResolveField(() => [Task])
    async tasks(@Parent() opportunity: OpportunityEntity): Promise<Task[]> {
        return this.opportunityService.findTasksByOpportunityId(opportunity.id);
    }
}
