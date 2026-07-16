import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { RequirementType } from '../enums';

registerEnumType(RequirementType, {
  name: 'RequirementType',
});

@ObjectType()
export class Requirement {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  organizationId!: string;

  @Field(() => RequirementType)
  type!: RequirementType;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => Boolean)
  mandatory!: boolean;
}

export const RequirementPaginatedResponse =
  createPaginatedResponseType<Requirement>(Requirement, 'Requirement');

export type RequirementPaginatedResponse = InstanceType<
  typeof RequirementPaginatedResponse
>;
