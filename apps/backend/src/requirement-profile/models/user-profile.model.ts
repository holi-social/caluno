import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserProfile {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  userId!: string;

  @Field(() => String)
  data!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
