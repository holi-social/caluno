import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { RequirementProfile } from '../../requirement-profile/models/requirement-profile.model';
import type { Organization } from './organization.model';
import { Organization as OrganizationModel } from './organization.model';
import { RequiredFormRef } from './organization-unit-required-form.model';
import { OrganizationUnitType } from './organization-unit-type.model';

@ObjectType()
export class OrganizationUnit {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String)
  organizationId!: string;

  @Field(() => String, { nullable: true })
  logoUrl?: string | null;

  @Field(() => String, { nullable: true })
  coverUrl?: string | null;

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

  @Field(() => OrganizationModel)
  organization!: Organization;

  @Field(() => OrganizationUnitType)
  type!: OrganizationUnitType;

  @Field(() => OrganizationUnit, { nullable: true })
  parent?: OrganizationUnit | null;

  @Field(() => [OrganizationUnit])
  children!: OrganizationUnit[];

  @Field(() => RequirementProfile, { nullable: true })
  requiredMembershipRequirementProfile?: RequirementProfile | null;

  @Field(() => Boolean)
  requiredFormsEnabled!: boolean;

  @Field(() => [RequiredFormRef])
  requiredForms!: RequiredFormRef[];

  @Field(() => Date, { nullable: true })
  deletedAt?: Date | null;

  @Field(() => Int)
  memberCount!: number;

  @Field(() => Int)
  openShiftsCount!: number;
}

export const OrganizationUnitPaginatedResponse =
  createPaginatedResponseType<OrganizationUnit>(
    OrganizationUnit,
    'OrganizationUnit',
  );

export type OrganizationUnitPaginatedResponse = InstanceType<
  typeof OrganizationUnitPaginatedResponse
>;
