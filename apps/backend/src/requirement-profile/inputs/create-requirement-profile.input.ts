import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateRequirementProfileInput {
  @Field(() => String)
  organizationId!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => [String], { nullable: true })
  requirementIds!: string[] | null;
}
