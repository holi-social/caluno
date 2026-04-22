import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { RequirementProfile } from '../../requirement-profile/models/requirement-profile.model';
import { UserRequirementStatus } from '../../requirement-profile/models/user-requirement-status.model';
import { JoinShiftStatus } from '../enums';
import { Shift } from './shift.model';

registerEnumType(JoinShiftStatus, {
  name: 'JoinShiftStatus',
});

@ObjectType()
export class JoinShiftResult {
  @Field(() => JoinShiftStatus)
  status: JoinShiftStatus;

  @Field(() => Shift)
  shift: Shift;

  @Field(() => ID, { nullable: true })
  membershipRequestId: string | null;

  @Field(() => RequirementProfile, { nullable: true })
  requirementProfile: RequirementProfile | null;

  @Field(() => [UserRequirementStatus], { nullable: true })
  requirementStatuses: UserRequirementStatus[] | null;
}
