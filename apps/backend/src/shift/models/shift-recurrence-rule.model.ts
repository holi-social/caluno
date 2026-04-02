import { Field, ID, ObjectType } from '@nestjs/graphql';
import { RecurrenceDay } from '../enums';

@ObjectType()
export class ShiftRecurrenceRule {
  @Field(() => ID)
  id: string;

  @Field(() => [RecurrenceDay])
  daysOfWeek: RecurrenceDay[];

  @Field(() => Date, { nullable: true })
  endsAt: Date | null;
}
