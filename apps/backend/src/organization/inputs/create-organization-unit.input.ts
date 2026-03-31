import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateOrganizationUnitInput {
  @Field(() => String)
  organizationId: string;

  @Field(() => String)
  parentId: string;

  @Field(() => String)
  typeId: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  logoUrl: string | null;

  @Field(() => String, { nullable: true })
  websiteUrl: string | null;

  @Field(() => String, { nullable: true })
  email: string | null;

  @Field(() => String, { nullable: true })
  phone: string | null;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String, { nullable: true })
  address: string | null;
}
