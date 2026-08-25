import { Field, ID, InputType, Int, registerEnumType } from '@nestjs/graphql';
import {
  ShiftInviteOrigin,
  ShiftInviteStatus,
  ShiftVisibility,
} from '../enums';

registerEnumType(ShiftVisibility, {
  name: 'ShiftVisibility',
});

registerEnumType(ShiftInviteOrigin, {
  name: 'ShiftInviteOrigin',
});

registerEnumType(ShiftInviteStatus, {
  name: 'ShiftInviteStatus',
});

@InputType()
export class CreateShiftInput {
  @Field(() => String)
  title!: string;

  @Field(() => ID, { nullable: true })
  eventId?: string | null;

  @Field(() => String, { nullable: true })
  instructions?: string | null;

  @Field(() => Date)
  startsAt!: Date;

  @Field(() => Date)
  endsAt!: Date;

  @Field(() => String, { nullable: true })
  location?: string | null;

  @Field(() => [String], { nullable: true })
  invitedMemberIds?: string[] | null;

  @Field(() => ShiftVisibility)
  visibility!: ShiftVisibility;

  @Field(() => Int, { nullable: true })
  maxVolunteers?: number | null;

  @Field(() => Int, { nullable: true })
  minVolunteers?: number | null;

  @Field(() => String, { nullable: true })
  rrule?: string | null;

  @Field(() => String, { nullable: true })
  imageFileId?: string | null;

  @Field(() => [String], { nullable: true })
  requiredFormIds?: string[] | null;
}
