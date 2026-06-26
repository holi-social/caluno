import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Role } from '../../auth/models/role.model';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { OrganizationUnit } from '../../organization/models/organization-unit.model';
import { User } from '../../user/models/user.model';

@ObjectType()
export class Membership {
  @Field(() => ID)
  id!: string;

  @Field(() => User)
  user!: User;

  @Field(() => OrganizationUnit)
  organizationUnit!: OrganizationUnit;

  @Field(() => [Role])
  roles!: Role[];
}

export const MembershipPaginatedResponse =
  createPaginatedResponseType<Membership>(Membership, 'Membership');

export type MembershipPaginatedResponse = InstanceType<
  typeof MembershipPaginatedResponse
>;
