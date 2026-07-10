import { Field, ID, ObjectType } from '@nestjs/graphql';
import { RequirementProfile } from '../../requirement-profile/models/requirement-profile.model';
import { UserRequirementStatus } from '../../requirement-profile/models/user-requirement-status.model';
import { JoinStatus } from '../../shared/enums/join-status.enum';

@ObjectType()
export class JoinOrganizationResult {
  @Field(() => JoinStatus)
  status!: JoinStatus;

  @Field(() => ID, { nullable: true })
  membershipRequestId?: string | null;

  @Field(() => RequirementProfile, { nullable: true })
  requirementProfile?: RequirementProfile | null;

  @Field(() => [UserRequirementStatus], { nullable: true })
  requirementStatuses?: UserRequirementStatus[] | null;
}
