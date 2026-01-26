import { Field, InputType } from '@nestjs/graphql';
import { OpportunityStatus } from '../enums';

@InputType()
export class CreateOpportunityInput {
  @Field(() => String)
  title: string;

  @Field(() => String)
  description: string;

  @Field(() => String)
  location: string;

  @Field(() => String)
  organizationId: string;

  @Field(() => Date)
  startsAt: Date;

  @Field(() => Date)
  endsAt: Date;

  @Field(() => OpportunityStatus, { defaultValue: OpportunityStatus.DRAFT })
  status: OpportunityStatus;
}
