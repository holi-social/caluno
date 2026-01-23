import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class PaginationInput {
  @Field(() => Int)
  offset: number = 0;

  @Field(() => Int)
  limit: number = 10;
}
