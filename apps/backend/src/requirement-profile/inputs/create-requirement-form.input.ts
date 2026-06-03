import { Field, InputType } from '@nestjs/graphql';
import { FormBlockRefInput } from './form-block-ref.input';
import { FormSettingsInput } from './form-settings.input';

@InputType()
export class CreateRequirementFormInput {
  @Field(() => String)
  organizationId!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => FormSettingsInput, { nullable: true })
  settings!: FormSettingsInput | null;

  @Field(() => [FormBlockRefInput], { nullable: true })
  blockRefs!: FormBlockRefInput[] | null;
}
