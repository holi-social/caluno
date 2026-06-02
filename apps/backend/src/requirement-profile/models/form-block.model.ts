import { Field, ID, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { FormBlockField } from './form-block-field.model';

@ObjectType()
export class FormBlock {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  organizationId!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => String, { nullable: true })
  icon!: string | null;

  @Field(() => Boolean)
  required!: boolean;

  @Field(() => String)
  createdBy!: string;

  @Field(() => String)
  updatedBy!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => [FormBlockField], { nullable: true })
  fields!: FormBlockField[];

  @Field(() => Boolean)
  isEditable!: boolean;
}

export const FormBlockPaginatedResponse =
  createPaginatedResponseType<FormBlock>(FormBlock, 'FormBlock');

export type FormBlockPaginatedResponse = InstanceType<
  typeof FormBlockPaginatedResponse
>;
