import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { ReimbursementType } from './reimbursement-type.model';

@ObjectType()
export class EffectiveRate {
  @Field(() => ReimbursementType)
  reimbursementType!: ReimbursementType;

  @Field(() => Int)
  hourlyRateCents!: number;

  @Field(() => Boolean)
  isOverride!: boolean;

  @Field(() => ID, { nullable: true })
  organizationUnitId?: string | null;
}
