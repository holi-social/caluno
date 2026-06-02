import { Field, InputType } from '@nestjs/graphql';
import { FormBlockRefInput } from './form-block-ref.input';
import { FormSettingsInput } from './form-settings.input';

@InputType()
export class UpdateRequirementFormInput {
  @Field(() => String, { nullable: true })
  name!: string | null;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => String, { nullable: true })
  locale!: string | null;

  @Field(() => FormSettingsInput, { nullable: true })
  settings!: FormSettingsInput | null;

  @Field(() => [FormBlockRefInput], { nullable: true })
  blockRefs!: FormBlockRefInput[] | null;
}
