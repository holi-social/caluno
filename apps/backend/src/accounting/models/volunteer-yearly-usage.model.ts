import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
import { ReimbursementTypeUsage } from './reimbursement-type-usage.model';

@ObjectType()
export class VolunteerYearlyUsage {
  @Field(() => User)
  volunteer!: User;

  @Field(() => [ReimbursementTypeUsage])
  usageByType!: ReimbursementTypeUsage[];
}
