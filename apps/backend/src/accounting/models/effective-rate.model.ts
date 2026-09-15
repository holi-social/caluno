import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { RateProvenance } from './rate-provenance.model';
import { ReimbursementType } from './reimbursement-type.model';

@ObjectType()
export class EffectiveRate {
  @Field(() => ReimbursementType)
  reimbursementType!: ReimbursementType;

  @Field(() => Int)
  hourlyRateCents!: number;

  @Field(() => Boolean)
  isOverride!: boolean;

  @Field(() => RateProvenance)
  provenance!: RateProvenance;

  @Field(() => ID, { nullable: true })
  organizationUnitId?: string | null;
}
