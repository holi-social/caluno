import { Field, ID, InputType } from '@nestjs/graphql';
import { MembershipRequestStatus } from '../enums';

@InputType()
export class UpdateMembershipRequestInput {
  @Field(() => ID)
  reviewedBy?: string;

  @Field(() => Date)
  reviewedAt?: Date;

  @Field(() => String)
  rejectionReason?: string;

  @Field(() => MembershipRequestStatus)
  status: MembershipRequestStatus;
}
