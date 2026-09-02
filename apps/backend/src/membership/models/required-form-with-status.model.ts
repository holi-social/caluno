import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { RequiredFormTargetType } from '../../requirement-profile/enums';
import { RequirementForm } from '../../requirement-profile/models/requirement-form.model';

@ObjectType()
export class RequiredFormWithStatus {
  @Field(() => RequirementForm)
  form!: RequirementForm;

  @Field(() => Int)
  order!: number;

  @Field(() => Boolean)
  submitted!: boolean;

  @Field(() => ID, { nullable: true })
  submissionId?: string | null;

  @Field(() => RequiredFormTargetType)
  targetType!: RequiredFormTargetType;

  @Field(() => ID)
  targetId!: string;
}
