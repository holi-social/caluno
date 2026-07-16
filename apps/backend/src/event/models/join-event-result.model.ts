import { Field, ID, ObjectType } from '@nestjs/graphql';
import { RequiredFormWithStatus } from '../../membership/models/required-form-with-status.model';
import { RequirementProfile } from '../../requirement-profile/models/requirement-profile.model';
import { UserRequirementStatus } from '../../requirement-profile/models/user-requirement-status.model';
import { JoinStatus } from '../../shared/enums/join-status.enum';
import { Event } from './event.model';

@ObjectType()
export class JoinEventResult {
  @Field(() => JoinStatus)
  status!: JoinStatus;

  @Field(() => Event)
  event!: Event;

  @Field(() => ID, { nullable: true })
  membershipRequestId!: string | null;

  @Field(() => RequirementProfile, { nullable: true })
  requirementProfile!: RequirementProfile | null;

  @Field(() => [UserRequirementStatus], { nullable: true })
  requirementStatuses!: UserRequirementStatus[] | null;

  @Field(() => [RequiredFormWithStatus], { nullable: true })
  requiredForms!: RequiredFormWithStatus[] | null;
}
