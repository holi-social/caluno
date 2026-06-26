import { Field, ID, ObjectType } from '@nestjs/graphql';
import { OrganizationUserProfileStatus } from '../enums';

@ObjectType()
export class OrganizationUserProfile {
  @Field(() => ID)
  id!: string;

  @Field(() => OrganizationUserProfileStatus)
  status!: OrganizationUserProfileStatus;

  @Field(() => Boolean)
  userProfileAccessApproved!: boolean;

  @Field(() => String, { nullable: true })
  note!: string | null;
}
