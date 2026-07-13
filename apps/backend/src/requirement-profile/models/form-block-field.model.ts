import { Field, ID, ObjectType } from '@nestjs/graphql';
import { FieldType } from '../enums';

@ObjectType()
export class SelectOption {
  @Field(() => String)
  label!: string;

  @Field(() => String)
  value!: string;
}

@ObjectType()
export class FormBlockField {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  blockId!: string;

  @Field(() => FieldType)
  type!: FieldType;

  @Field(() => String)
  label!: string;

  @Field(() => String, { nullable: true })
  placeholder!: string | null;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => Boolean)
  required!: boolean;

  @Field(() => Boolean)
  lockType!: boolean;

  @Field(() => String, { nullable: true })
  systemKey!: string | null;

  @Field(() => [SelectOption], { nullable: true })
  options!: SelectOption[] | null;

  @Field(() => String, { nullable: true })
  documentFileId!: string | null;

  @Field(() => String, { nullable: true })
  documentLabel!: string | null;

  @Field(() => String, { nullable: true })
  documentDownloadUrl?: string | null;

  @Field(() => String, { nullable: true })
  documentFilename?: string | null;

  @Field(() => Number, { nullable: true })
  minAge!: number | null;

  @Field(() => Number)
  fieldOrder!: number;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
