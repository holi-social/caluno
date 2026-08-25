import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { OrganizationUserProfileStatus } from '../enums';

registerEnumType(OrganizationUserProfileStatus, {
  name: 'OrganizationUserProfileStatus',
});

@ObjectType()
export class OrganizationUserProfile {
  @Field(() => ID)
  id!: string;

  @Field(() => OrganizationUserProfileStatus)
  status!: OrganizationUserProfileStatus;

  @Field(() => Boolean)
  userProfileAccessApproved!: boolean;

  @Field(() => String, { nullable: true })
  note?: string | null;
}
