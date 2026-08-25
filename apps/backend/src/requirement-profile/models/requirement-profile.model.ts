import { Field, ID, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { Requirement } from './requirement.model';

@ObjectType()
export class RequirementProfile {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  organizationId!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => [Requirement], { nullable: true })
  requirements?: Requirement[] | null;
}

export const RequirementProfilePaginatedResponse =
  createPaginatedResponseType<RequirementProfile>(
    RequirementProfile,
    'RequirementProfile',
  );

export type RequirementProfilePaginatedResponse = InstanceType<
  typeof RequirementProfilePaginatedResponse
>;
