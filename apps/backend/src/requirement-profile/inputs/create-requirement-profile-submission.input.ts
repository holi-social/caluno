import { Field, InputType } from '@nestjs/graphql';
import {
  RequirementFulfillmentStatus,
  RequirementProfileSubmissionStatus,
} from '../enums';

@InputType()
export class CreateRequirementSubmissionFulfillmentInput {
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

  @Field(() => [CreateRequirementSubmissionFulfillmentInput], {
    nullable: true,
  })
  fulfillments?: CreateRequirementSubmissionFulfillmentInput[];
}
