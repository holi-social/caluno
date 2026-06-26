import { Field, ID, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { User } from '../../user/models/user.model';
import { FormSubmissionStatus } from '../enums';
import { FormSubmissionValue } from './form-submission-value.model';
import { RequirementForm } from './requirement-form.model';

@ObjectType()
export class FormSubmission {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  formId!: string;

  @Field(() => String)
  userId!: string;

  @Field(() => String, { nullable: true })
  membershipId!: string | null;

  @Field(() => FormSubmissionStatus)
  status!: FormSubmissionStatus;

  @Field(() => Date)
  submittedAt!: Date;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => [FormSubmissionValue], { nullable: true })
  values!: FormSubmissionValue[];

  @Field(() => RequirementForm, { nullable: true })
  form!: RequirementForm | null;

  @Field(() => User, { nullable: true })
  user!: User | null;
}

export const FormSubmissionPaginatedResponse =
  createPaginatedResponseType<FormSubmission>(FormSubmission, 'FormSubmission');

export type FormSubmissionPaginatedResponse = InstanceType<
  typeof FormSubmissionPaginatedResponse
>;
