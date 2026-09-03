import { Field, Float, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
import { ReimbursementType } from './reimbursement-type.model';

@ObjectType()
export class VolunteerNeedsTimesheet {
  @Field(() => User)
  volunteer!: User;

  @Field(() => ReimbursementType)
  reimbursementType!: ReimbursementType;

  @Field(() => Float)
  eligibleHours!: number;
}
