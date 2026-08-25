import { Field, InputType } from '@nestjs/graphql';
import { FieldType } from '../enums';
import { SelectOptionInput } from './create-form-block-field.input';

@InputType()
export class UpdateFormBlockFieldInput {
  // Non-nullable in DB — undefined means "don't update", no null allowed
  @Field(() => FieldType, { nullable: true })
  type?: FieldType | null;

  @Field(() => String, { nullable: true })
  label?: string | null;

  @Field(() => Boolean, { nullable: true })
  required?: boolean | null;

  @Field(() => Boolean, { nullable: true })
  lockType?: boolean | null;

  @Field(() => Number, { nullable: true })
  fieldOrder?: number | null;

  // Nullable in DB — undefined means "don't update", null means "clear"
  @Field(() => String, { nullable: true })
  placeholder?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  systemKey?: string | null;

  @Field(() => [SelectOptionInput], { nullable: true })
  options?: SelectOptionInput[] | null;

  @Field(() => String, { nullable: true })
  documentFileId?: string | null;

  @Field(() => String, { nullable: true })
  documentLabel?: string | null;

  @Field(() => Number, { nullable: true })
  minAge?: number | null;
}
