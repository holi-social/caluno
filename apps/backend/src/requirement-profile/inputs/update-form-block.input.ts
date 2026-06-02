import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateFormBlockInput {
  @Field(() => String, { nullable: true })
  title!: string | null;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => String, { nullable: true })
  icon!: string | null;

  @Field(() => Boolean, { nullable: true })
  required!: boolean | null;
}
