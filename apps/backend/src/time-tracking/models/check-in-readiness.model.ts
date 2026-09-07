import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ShiftInviteStatus } from '../../shift/enums';

@ObjectType()
export class CheckInReadiness {
  @Field(() => Boolean)
  isMember!: boolean;

  @Field(() => ID, { nullable: true })
  openMembershipRequestId?: string | null;

  @Field(() => ShiftInviteStatus, { nullable: true })
  shiftInviteStatus?: ShiftInviteStatus | null;

  @Field(() => Boolean)
  isParticipating!: boolean;

  @Field(() => Boolean)
  hasOpenTimeEntry!: boolean;
}
