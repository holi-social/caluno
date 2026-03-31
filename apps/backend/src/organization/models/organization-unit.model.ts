import { Field, ID, ObjectType } from '@nestjs/graphql';

import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { Organization } from './organization.model';
import { OrganizationUnitType } from './organization-unit-type.model';

@ObjectType()
export class OrganizationUnit {
  @Field(() => ID)
  id: string;

  @Field(() => Boolean)
  isRoot: boolean;

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

  @Field(() => Organization)
  organization: Organization;

  @Field(() => OrganizationUnitType)
  type: OrganizationUnitType;

  @Field(() => OrganizationUnit, { nullable: true })
  parent: OrganizationUnit | null;

  @Field(() => [OrganizationUnit])
  children: OrganizationUnit[];
}

export const OrganizationUnitPaginatedResponse =
  createPaginatedResponseType<OrganizationUnit>(
    OrganizationUnit,
    'OrganizationUnit',
  );

export type OrganizationUnitPaginatedResponse = InstanceType<
  typeof OrganizationUnitPaginatedResponse
>;
