import { Field, ID, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { User } from '../../user/models/user.model';
import { RequirementFulfillmentStatus } from '../enums';
import { Document } from './document.model';
import { OrganizationUserProfile } from './organization-user-profile.model';
import { Requirement } from './requirement.model';
import { RequirementProfileSubmission } from './requirement-profile-submission.model';

@ObjectType()
export class RequirementFulfillment {
  @Field(() => ID)
  id: string;

  @Field(() => OrganizationUserProfile, { nullable: true })
  profile: OrganizationUserProfile | null;

  @Field(() => Document, { nullable: true })
  document: Document | null;

  @Field(() => String, { nullable: true })
  value: string | null;

  @Field(() => RequirementFulfillmentStatus)
  status: RequirementFulfillmentStatus;

  @Field(() => Date, { nullable: true })
  submittedAt: Date | null;

  @Field(() => Date, { nullable: true })
  reviewedAt: Date | null;

  @Field(() => RequirementProfileSubmission)
  submission: RequirementProfileSubmission;

  @Field(() => Requirement)
  requirement: Requirement;

  @Field(() => User, { nullable: true })
  reviewedBy: User | null;
}

export const RequirementFulfillmentPaginatedResponse =
  createPaginatedResponseType<RequirementFulfillment>(
    RequirementFulfillment,
    'RequirementFulfillment',
  );

export type RequirementFulfillmentPaginatedResponse = InstanceType<
  typeof RequirementFulfillmentPaginatedResponse
>;
