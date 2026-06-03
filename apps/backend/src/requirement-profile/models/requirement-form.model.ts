import { Field, ID, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { RequirementFormBlockRef } from './requirement-form-block-ref.model';

@ObjectType()
export class FormSettings {
  @Field(() => String, { nullable: true })
  submitButtonLabel!: string | null;

  @Field(() => String, { nullable: true })
  successTitle!: string | null;

  @Field(() => String, { nullable: true })
  successMessage!: string | null;

  @Field(() => Boolean, { nullable: true })
  allowEmbed!: boolean | null;
}

@ObjectType()
export class RequirementForm {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  organizationId!: string;

  @Field(() => String, { nullable: true })
  organizationUnitId!: string | null;

  @Field(() => String)
  slug!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => FormSettings)
  settings!: FormSettings;

  @Field(() => String)
  shareToken!: string;

  @Field(() => String)
  createdBy!: string;

  @Field(() => String)
  updatedBy!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => [RequirementFormBlockRef], { nullable: true })
  blockRefs!: RequirementFormBlockRef[];

  @Field(() => Number)
  submissionCount!: number;
}

export const RequirementFormPaginatedResponse =
  createPaginatedResponseType<RequirementForm>(
    RequirementForm,
    'RequirementForm',
  );

export type RequirementFormPaginatedResponse = InstanceType<
  typeof RequirementFormPaginatedResponse
>;
