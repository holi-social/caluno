import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PaginationInfo {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  offset: number;

  @Field(() => Boolean)
  hasMore: boolean;
}
