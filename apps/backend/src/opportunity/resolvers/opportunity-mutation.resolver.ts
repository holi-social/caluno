import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Session } from '@thallesp/nestjs-better-auth';
import { CreateOpportunityInput } from '../inputs/create-opportunity.input';
import { Opportunity } from '../models/opportunity.model';
import { OpportunityService } from '../opportunity.service';

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

  @Mutation(() => Opportunity)
  async publishOpportunity(
    @Args('id', { type: () => ID }) id: string,
    @Session() session: UserSession,
  ): Promise<Opportunity> {
    return this.opportunityService.publish(session.user.id, id);
  }
}
