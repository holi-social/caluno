import { Field, ID, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { Membership } from '../../membership/models/membership.model';
import { MembershipRequest } from '../../membership/models/membership-request.model';
import { User } from '../../user/models/user.model';
import { RequirementProfileSubmissionStatus } from '../enums';
import { RequirementFulfillment } from './requirement-fulfillment.model';
import { RequirementProfile } from './requirement-profile.model';

@ObjectType()
export class RequirementProfileSubmission {
  @Field(() => ID)
  id: string;

  @Field(() => Membership, { nullable: true })
  membership: Membership | null;

  @Field(() => MembershipRequest, { nullable: true })
  membershipRequest: MembershipRequest | null;

  @Field(() => RequirementProfileSubmissionStatus)
  status: RequirementProfileSubmissionStatus;

  @Field(() => Date, { nullable: true })
  submittedAt: Date | null;

  @Field(() => Date, { nullable: true })
  reviewedAt: Date | null;

  @Field(() => RequirementProfile)
  requirementProfile: RequirementProfile;

  @Field(() => [RequirementFulfillment], { nullable: true })
  fulfillments: RequirementFulfillment[];

  @Field(() => User, { nullable: true })
  reviewedBy: User | null;
}

export const RequirementProfileSubmissionPaginatedResponse =
  createPaginatedResponseType<RequirementProfileSubmission>(
    RequirementProfileSubmission,
    'RequirementProfileSubmission',
  );

export type RequirementProfileSubmissionPaginatedResponse = InstanceType<
  typeof RequirementProfileSubmissionPaginatedResponse
>;
