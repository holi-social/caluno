import { Field, ID, ObjectType } from '@nestjs/graphql';

import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import type { OrganizationUnit } from './organization-unit.model';
import { OrganizationUnit as OrganizationUnitModel } from './organization-unit.model';

@ObjectType()
export class Organization {
  @Field(() => ID)
  id!: string;
  @Field(() => String)
  name!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String, { nullable: true })
  logoUrl?: string | null;

  @Field(() => String, { nullable: true })
  websiteUrl?: string | null;

  @Field(() => String, { nullable: true })
  contactEmail?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => OrganizationUnitModel)
  root!: OrganizationUnit;

  @Field(() => [OrganizationUnitModel])
  units!: OrganizationUnit[];

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;
}

export const OrganizationPaginatedResponse =
  createPaginatedResponseType<Organization>(Organization, 'Organization');

export type OrganizationPaginatedResponse = InstanceType<
  typeof OrganizationPaginatedResponse
>;
