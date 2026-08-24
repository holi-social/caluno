import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ReimbursementType } from './reimbursement-type.model';

@ObjectType()
export class ReimbursementTypeUsage {
  @Field(() => ReimbursementType)
  reimbursementType!: ReimbursementType;

  @Field(() => Int)
  usedCents!: number;

  @Field(() => Int)
  limitCents!: number;

  @Field(() => Int)
  remainingCents!: number;
}
