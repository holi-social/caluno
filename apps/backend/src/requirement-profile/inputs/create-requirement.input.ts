import { Field, InputType } from '@nestjs/graphql';
import { RequirementType } from '../enums';

@InputType()
export class CreateRequirementInput {
  @Field(() => String)
  organizationId!: string;

  @Field(() => RequirementType)
  type!: RequirementType;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => Boolean, { defaultValue: false })
  mandatory!: boolean;
}
