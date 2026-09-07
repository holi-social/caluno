import { Field, ID, ObjectType } from '@nestjs/graphql';
import { InviteAllowanceState } from '../services/invite-allowance-eligibility';

@ObjectType()
export class VolunteerInviteAllowance {
  @Field(() => ID)
  volunteerId!: string;

  @Field(() => InviteAllowanceState)
  state!: InviteAllowanceState;
}
