import { Field, InputType } from '@nestjs/graphql';
@InputType()
export class CreateRequirementSubmissionFulfillmentInput {
  @Field(() => String)
  requirementId!: string;

  @Field(() => String, { nullable: true })
  fileId?: string | null;

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
  profileId!: string;

  @Field(() => String, { nullable: true })
  membershipId?: string | null;

  @Field(() => String, { nullable: true })
  membershipRequestId?: string | null;

  @Field(() => [CreateRequirementSubmissionFulfillmentInput], {
    nullable: true,
  })
  fulfillments?: CreateRequirementSubmissionFulfillmentInput[] | null;
}
