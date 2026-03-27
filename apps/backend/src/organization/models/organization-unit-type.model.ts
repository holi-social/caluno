import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OrganizationUnitType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String)
  icon: string;
}
