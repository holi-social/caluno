import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { RecurrenceDay, ShiftVisibility } from '../enums';

registerEnumType(ShiftVisibility, {
  name: 'ShiftVisibility',
});

registerEnumType(RecurrenceDay, {
  name: 'RecurrenceDay',
});

@InputType()
export class CreateShiftInput {
  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  instructions: string | null;

  @Field(() => Date)
  startsAt: Date;

  @Field(() => Date)
  endsAt: Date;

  @Field(() => String, { nullable: true })
  location: string | null;

  @Field(() => [String], { nullable: true })
  invitedMemberIds: string[];

  @Field(() => ShiftVisibility, { defaultValue: ShiftVisibility.ALL_MEMBERS })
  visibility: ShiftVisibility;

  @Field(() => Int, { nullable: true })
  maxVolunteers: number | null;

  @Field(() => [RecurrenceDay], { nullable: true })
  recurrenceDays: RecurrenceDay[] | null;

  @Field(() => Date, { nullable: true })
  recurrenceEndsAt: Date | null;
}
