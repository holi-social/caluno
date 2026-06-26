import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class FormFieldValueInput {
  @Field(() => String)
  fieldId!: string;

  @Field(() => String)
  blockId!: string;

  @Field(() => String)
  value!: string;
}

@InputType()
export class SubmitFormInput {
  @Field(() => [FormFieldValueInput])
  values!: FormFieldValueInput[];
}
