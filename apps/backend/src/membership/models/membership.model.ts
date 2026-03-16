import { Field, ID, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
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
}

export const MembershipPaginatedResponse =
  createPaginatedResponseType<Membership>(Membership, 'Membership');

export type MembershipPaginatedResponse = InstanceType<
  typeof MembershipPaginatedResponse
>;
