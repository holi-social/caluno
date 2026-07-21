import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EventOrganizationUnit {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String, { nullable: true })
  logoUrl?: string | null;
}
