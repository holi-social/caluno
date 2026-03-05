import { Field, ID, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { OrganizationRole } from '../../organization/enums';
import { Organization } from '../../organization/models/organization.model';
import { User } from '../../user/models/user.model';

@ObjectType()
export class Membership {
  @Field(() => ID)
  id: string;

  @Field(() => User)
  user: User;

  @Field(() => Organization)
  organization: Organization;

  @Field(() => OrganizationRole)
  role: OrganizationRole;
}

export const MembershipPaginatedResponse =
  createPaginatedResponseType<Membership>(Membership, 'Membership');

export type MembershipPaginatedResponse = InstanceType<
  typeof MembershipPaginatedResponse
>;
