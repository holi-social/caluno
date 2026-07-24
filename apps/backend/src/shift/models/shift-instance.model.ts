import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { User } from '../../user/models/user.model';
import { ShiftInviteStatus } from '../enums';
import type { Shift } from './shift.model';
import { Shift as ShiftModel } from './shift.model';

@ObjectType()
export class ShiftInstance {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  masterId!: string;

  @Field(() => ShiftModel)
  master!: Shift;

  @Field(() => Date)
  actualStartsAt!: Date;

  @Field(() => Date)
  actualEndsAt!: Date;

  @Field(() => String, { nullable: true })
  overrideTitle?: string | null;

  @Field(() => String, { nullable: true })
  overrideInstructions?: string | null;

  @Field(() => String, { nullable: true })
  overrideLocation?: string | null;

  @Field(() => Int, { nullable: true })
  overrideMaxVolunteers?: number | null;

  @Field(() => Boolean)
  isException!: boolean;

  @Field(() => Boolean)
  isCancelled!: boolean;

  @Field(() => Int)
  occurrenceIndex!: number;

  @Field(() => Boolean)
  isCheckedIn!: boolean;

  @Field(() => Int)
  filledCount!: number;

  @Field(() => [User], { nullable: true })
  volunteers?: User[] | null;

  @Field(() => ShiftInviteStatus, { nullable: true })
  myInviteStatus?: ShiftInviteStatus | null;
}

export const ShiftInstancePaginatedResponse =
  createPaginatedResponseType<ShiftInstance>(ShiftInstance, 'ShiftInstance');

export type ShiftInstancePaginatedResponse = InstanceType<
  typeof ShiftInstancePaginatedResponse
>;
