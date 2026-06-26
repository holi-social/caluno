import { Field, ID, ObjectType } from '@nestjs/graphql';
import { RequirementFulfillmentStatus } from '../enums';

@ObjectType()
export class UserRequirementStatus {
  @Field(() => ID)
  requirementId!: string;

  @Field(() => String)
  name!: string;

  @Field(() => RequirementFulfillmentStatus)
  status!: RequirementFulfillmentStatus;
}
