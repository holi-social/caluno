import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FormSubmissionValue {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  submissionId!: string;

  @Field(() => String)
  fieldId!: string;

  @Field(() => String)
  blockId!: string;

  @Field(() => String)
  value!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
