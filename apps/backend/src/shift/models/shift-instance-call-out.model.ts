import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';

/** Summary of the most recent call-out sent for a shift instance. */
@ObjectType()
export class ShiftInstanceCallOutSummary {
  @Field(() => Date)
  sentAt!: Date;

  @Field(() => Int)
  recipientCount!: number;

  @Field(() => User)
  sentBy!: User;
}

/** Outcome of triggering a call-out for a shift instance. */
@ObjectType()
export class ShiftInstanceCallOutResult {
  @Field(() => Int)
  recipientCount!: number;

  /** True when there was nobody left to ask, and the manager was emailed instead. */
  @Field(() => Boolean)
  sentToManagerFallback!: boolean;
}
