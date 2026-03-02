import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { Project } from '../../project/models/project.model';
import { User } from '../../user/models/user.model';
import { OrganizationRole } from '../enums';

registerEnumType(OrganizationRole, {
  name: 'OrganizationRole',
});

@ObjectType()
export class Organization {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  slug: string;

  @Field(() => String, { nullable: true })
  logoUrl: string | null;

  @Field(() => String, { nullable: true })
  websiteUrl: string | null;

  @Field(() => String, { nullable: true })
  email: string | null;

  @Field(() => String, { nullable: true })
  phone: string | null;

  @Field(() => String, { nullable: true })
  address: string | null;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => Organization, { nullable: true })
  parent: Organization | null;

  @Field(() => [Organization])
  children: Organization[];

  @Field(() => [User], { nullable: true })
  admins: User[];

  @Field(() => [User], { nullable: true })
  moderators: User[];

  @Field(() => [User], { nullable: true })
  volunteers: User[];

  @Field(() => [Project], { nullable: true })
  projects: Project[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  updatedAt: Date;
}

export const OrganizationPaginatedResponse =
  createPaginatedResponseType<Organization>(Organization, 'Organization');

export type OrganizationPaginatedResponse = InstanceType<
  typeof OrganizationPaginatedResponse
>;
