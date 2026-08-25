import { Field, InputType } from '@nestjs/graphql';
import { FormBlockRefInput } from './form-block-ref.input';
import { FormSettingsInput } from './form-settings.input';

@InputType()
export class UpdateRequirementFormInput {
  @Field(() => String, { nullable: true })
  name?: string | null;

  // Nullable in DB — null clears the value
  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => FormSettingsInput, { nullable: true })
  settings?: FormSettingsInput | null;

  @Field(() => [FormBlockRefInput], { nullable: true })
  blockRefs?: FormBlockRefInput[] | null;
}
