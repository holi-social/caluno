import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class FormSettingsInput {
  @Field(() => String, { nullable: true })
  submitButtonLabel!: string | null;

  @Field(() => String, { nullable: true })
  successTitle!: string | null;

  @Field(() => String, { nullable: true })
  successMessage!: string | null;

  @Field(() => Boolean, { nullable: true })
  allowEmbed!: boolean | null;
}
