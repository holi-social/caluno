import { Field, ID, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { Shift } from '../../shift/models/shift.model';
import { User } from '../../user/models/user.model';

@ObjectType()
export class TimeEntry {
  @Field(() => ID)
  id: string;

  @Field(() => Date)
  startedAt: Date;

  @Field(() => Date)
  endedAt: Date;

  @Field(() => String, { nullable: true })
  notes: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => User)
  volunteer: User;

  @Field(() => Shift)
  shift: Shift;
}

export const TimeEntryPaginatedResponse =
  createPaginatedResponseType<TimeEntry>(TimeEntry, 'TimeEntry');

export type TimeEntryPaginatedResponse = InstanceType<
  typeof TimeEntryPaginatedResponse
>;
