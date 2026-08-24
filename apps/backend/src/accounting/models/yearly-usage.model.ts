import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class YearlyUsage {
  @Field(() => Int)
  usedCents!: number;

  @Field(() => Int)
  limitCents!: number;

  @Field(() => Int)
  remainingCents!: number;
}
