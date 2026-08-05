import { Field, ID, ObjectType } from '@nestjs/graphql';
import { RequirementForm } from './requirement-form.model';

@ObjectType()
export class MyOrgUnitForm {
  @Field(() => RequirementForm)
  form!: RequirementForm;

  @Field(() => Boolean)
  completed!: boolean;

  @Field(() => ID, { nullable: true })
  submissionId?: string | null;

  @Field(() => Date, { nullable: true })
  submittedAt?: Date | null;
}
