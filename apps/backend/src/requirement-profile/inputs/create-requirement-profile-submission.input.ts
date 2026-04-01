import { Field, InputType } from '@nestjs/graphql';
import { RequirementProfileSubmissionStatus } from '../enums';

@InputType()
export class CreateRequirementProfileSubmissionInput {
  @Field(() => String)
  profileId: string;

  @Field(() => String, { nullable: true })
  membershipId: string | null;

  @Field(() => String, { nullable: true })
  requestId: string | null;

  @Field(() => RequirementProfileSubmissionStatus, {
    defaultValue: RequirementProfileSubmissionStatus.DRAFT,
  })
  status: RequirementProfileSubmissionStatus;

  @Field(() => Date, { nullable: true })
  submittedAt: Date | null;
}
