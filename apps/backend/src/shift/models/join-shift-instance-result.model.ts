import { Field, ID, ObjectType } from '@nestjs/graphql';
import { RequiredFormWithStatus } from '../../membership/models/required-form-with-status.model';
import { RequirementProfile } from '../../requirement-profile/models/requirement-profile.model';
import { UserRequirementStatus } from '../../requirement-profile/models/user-requirement-status.model';
import { JoinStatus } from '../../shared/enums/join-status.enum';
import { ShiftInstance } from './shift-instance.model';

@ObjectType()
export class JoinShiftInstanceResult {
  @Field(() => JoinStatus)
  status!: JoinStatus;

  @Field(() => ShiftInstance)
  shiftInstance!: ShiftInstance;

  @Field(() => ID, { nullable: true })
  membershipRequestId!: string | null;

  @Field(() => RequirementProfile, { nullable: true })
  requirementProfile!: RequirementProfile | null;

  @Field(() => [UserRequirementStatus], { nullable: true })
  requirementStatuses!: UserRequirementStatus[] | null;

  @Field(() => [RequiredFormWithStatus], { nullable: true })
  requiredForms!: RequiredFormWithStatus[] | null;
}
