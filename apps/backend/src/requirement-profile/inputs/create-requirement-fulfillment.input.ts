import { Field, InputType } from '@nestjs/graphql';
import { RequirementFulfillmentStatus } from '../enums';

@InputType()
export class CreateRequirementFulfillmentInput {
  @Field(() => String)
  submissionId: string;

  @Field(() => String)
  requirementId: string;

  @Field(() => String, { nullable: true })
  profileId: string | null;

  @Field(() => String, { nullable: true })
  documentId: string | null;

  @Field(() => String, { nullable: true })
  value: string | null;

  @Field(() => RequirementFulfillmentStatus, {
    defaultValue: RequirementFulfillmentStatus.DRAFT,
  })
  status: RequirementFulfillmentStatus;

  @Field(() => Date, { nullable: true })
  submittedAt: Date | null;
}
