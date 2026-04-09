import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { OrganizationUnit } from '../../organization/models/organization-unit.model';
import { User } from '../../user/models/user.model';
import { MembershipRequestStatus } from '../enums';

registerEnumType(MembershipRequestStatus, {
  name: 'MembershipRequestStatus',
});

@ObjectType()
export class MembershipRequest {
  @Field(() => ID)
  id: string;

  @Field(() => User)
  user: User;

  @Field(() => OrganizationUnit)
  organizationUnit: OrganizationUnit;

  @Field(() => User, { nullable: true })
  reviewedBy: User | null;

  @Field(() => Date, { nullable: true })
  reviewedAt: Date | null;

  @Field(() => String, { nullable: true })
  rejectionReason: string | null;

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
