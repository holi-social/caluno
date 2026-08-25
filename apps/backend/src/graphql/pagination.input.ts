import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class PaginationInput {
  @Field(() => Int)
  offset: number = 0;

  @Field(() => Int)
  limit: number = 10;
}

@ArgsType()
export class DateRangePaginationInput extends PaginationInput {
  @Field(() => Int)
  limit: number = 15;

  @Field(() => Date, { nullable: true })
  startsAfter: Date | null = null;

  @Field(() => Date, { nullable: true })
  endsBefore: Date | null = null;
}
