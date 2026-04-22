import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { RequirementProfile } from '../../requirement-profile/models/requirement-profile.model';
import { UserRequirementStatus } from '../../requirement-profile/models/user-requirement-status.model';
import { JoinOrganizationStatus } from '../enums';

registerEnumType(JoinOrganizationStatus, {
  name: 'JoinOrganizationStatus',
});

@ObjectType()
export class JoinOrganizationResult {
  @Field(() => JoinOrganizationStatus)
  status: JoinOrganizationStatus;

  @Field(() => ID, { nullable: true })
  membershipRequestId: string | null;

  @Field(() => RequirementProfile, { nullable: true })
  requirementProfile: RequirementProfile | null;

  @Field(() => [UserRequirementStatus], { nullable: true })
  requirementStatuses: UserRequirementStatus[] | null;
}
