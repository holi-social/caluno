import { Field, ID, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { ShiftInstance } from '../../shift/models/shift-instance.model';
import { User } from '../../user/models/user.model';

@ObjectType()
export class TimeEntry {
  @Field(() => ID)
  id!: string;

  @Field(() => Date)
  startedAt!: Date;

  @Field(() => Date, { nullable: true })
  endedAt!: Date | null;

  @Field(() => String, { nullable: true })
  notes!: string | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => User)
  volunteer!: User;

  @Field(() => ShiftInstance)
  shiftInstance!: ShiftInstance;
}

export const TimeEntryPaginatedResponse =
  createPaginatedResponseType<TimeEntry>(TimeEntry, 'TimeEntry');

export type TimeEntryPaginatedResponse = InstanceType<
  typeof TimeEntryPaginatedResponse
>;
