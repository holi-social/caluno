import { Args, Mutation, Resolver } from '@nestjs/graphql';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Session } from '@thallesp/nestjs-better-auth';
import type { CreateOpportunityInput } from '../inputs/create-opportunity.input';
import { Opportunity } from '../models/opportunity.model';
import type { OpportunityService } from '../opportunity.service';

@Resolver(() => Opportunity)
export class OpportunityMutationResolver {
  constructor(private readonly opportunityService: OpportunityService) {}

  @Mutation(() => Opportunity)
  async createOpportunity(
    @Args('input') input: CreateOpportunityInput,
    @Session() session: UserSession,
  ): Promise<Opportunity> {
    return this.opportunityService.create(session.user.id, input);
  }
}
