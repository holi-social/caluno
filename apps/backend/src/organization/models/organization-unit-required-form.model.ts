import { Field, Int, ObjectType } from '@nestjs/graphql';
import { RequirementForm } from '../../requirement-profile/models/requirement-form.model';

@ObjectType()
export class RequiredFormRef {
  @Field(() => RequirementForm)
  form!: RequirementForm;

  @Field(() => Int)
  order!: number;
}
