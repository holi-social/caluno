import { Field, InputType } from '@nestjs/graphql';
import {
  RequirementFulfillmentStatus,
  RequirementProfileSubmissionStatus,
} from '../enums';

@InputType()
export class CreateRequirementSubmissionFulfillmentInput {
  @Field(() => String)
  requirementId: string;

  @Field(() => RequirementFulfillmentStatus, {
    defaultValue: RequirementFulfillmentStatus.DRAFT,
  })
  status: RequirementFulfillmentStatus;

  @Field(() => Date, { nullable: true })
  submittedAt: Date | null;

  @Field(() => String, { nullable: true })
  documentId?: string | null;

  @Field(() => Boolean, { nullable: true })
  checked?: boolean | null;

  @Field(() => Date, { nullable: true })
  date?: Date | null;

  @Field(() => String, { nullable: true })
  text?: string | null;
}

@InputType()
export class CreateRequirementProfileSubmissionInput {
  @Field(() => String)
  profileId: string;

  @Field(() => String, { nullable: true })
  membershipId: string | null;

  @Field(() => String, { nullable: true })
  membershipRequestId: string | null;

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
