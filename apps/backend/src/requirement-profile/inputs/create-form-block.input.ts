import { Field, InputType } from '@nestjs/graphql';
import { CreateFormBlockFieldInput } from './create-form-block-field.input';

@InputType()
export class CreateFormBlockInput {
  @Field(() => String)
  organizationId!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => String, { nullable: true })
  icon!: string | null;

  @Field(() => Boolean, { nullable: true })
  required!: boolean | null;

  @Field(() => [CreateFormBlockFieldInput], { nullable: true })
  fields!: CreateFormBlockFieldInput[] | null;
}
