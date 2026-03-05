import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { OrganizationRole } from '../../organization/enums';
import { Organization } from '../../organization/models/organization.model';
import { User } from '../../user/models/user.model';
import { MembershipRequestStatus } from '../enums';

registerEnumType(MembershipRequestStatus, {
  name: 'MembershipRequestStatus',
});

@ObjectType()
export class MembershipRequest {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  user: User;

  @Field(() => Organization)
  organization: Organization;

  @Field(() => User)
  reviewedBy: User;

  @Field(() => Date)
  reviewedAt: Date;

  @Field(() => String)
  rejectionReason: string;

  @Field(() => MembershipRequestStatus)
  status: MembershipRequestStatus;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

export const MembershipRequestPaginatedResponse =
  createPaginatedResponseType<MembershipRequest>(
    MembershipRequest,
    'MembershipRequest',
  );

export type MembershipRequestPaginatedResponse = InstanceType<
  typeof MembershipRequestPaginatedResponse
>;
