import { Field, InputType } from '@nestjs/graphql';
import { FieldType } from '../enums';

@InputType()
export class SelectOptionInput {
  @Field(() => String)
  label!: string;

  @Field(() => String)
  value!: string;
}

@InputType()
export class CreateFormBlockFieldInput {
  @Field(() => FieldType)
  type!: FieldType;

  @Field(() => String)
  label!: string;

  @Field(() => String, { nullable: true })
  placeholder!: string | null;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => Boolean, { nullable: true })
  required!: boolean | null;

  @Field(() => Boolean, { nullable: true })
  lockType!: boolean | null;

  @Field(() => String, { nullable: true })
  systemKey!: string | null;

  @Field(() => [SelectOptionInput], { nullable: true })
  options!: SelectOptionInput[] | null;

  @Field(() => String, { nullable: true })
  documentFileId!: string | null;

  @Field(() => String, { nullable: true })
  documentLabel!: string | null;

  @Field(() => Number, { nullable: true })
  minAge!: number | null;

  @Field(() => Number, { nullable: true })
  fieldOrder!: number | null;
}
