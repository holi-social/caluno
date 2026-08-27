import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
import { ReimbursementType } from './reimbursement-type.model';

@ObjectType()
export class ManualBaseline {
  @Field(() => User)
  volunteer!: User;

  @Field(() => ReimbursementType)
  reimbursementType!: ReimbursementType;

  @Field(() => Int)
  year!: number;

  @Field(() => Int)
  amountCents!: number;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => User, { nullable: true })
  updatedByUser?: User | null;
}
