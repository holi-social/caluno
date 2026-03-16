import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Permission {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  key: string;

  @Field(() => String, { nullable: true })
  description: string | null;
}
