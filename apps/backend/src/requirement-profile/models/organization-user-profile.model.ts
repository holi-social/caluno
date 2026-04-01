import { Field, ID, ObjectType } from '@nestjs/graphql';
import { OrganizationUserProfileStatus } from '../enums';

@ObjectType()
export class OrganizationUserProfile {
  @Field(() => ID)
  id: string;

  @Field(() => OrganizationUserProfileStatus)
  status: OrganizationUserProfileStatus;

  @Field(() => Boolean)
  canAccessPhoneNumber: boolean;

  @Field(() => Boolean)
  canAccessAddress: boolean;

  @Field(() => Boolean)
  canAccessBankAccountNumber: boolean;

  @Field(() => String, { nullable: true })
  note: string | null;
}
