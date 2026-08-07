import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { JoinStatus } from '../../shared/enums/join-status.enum';
import { Shift } from '../../shift/models/shift.model';
import { User } from '../../user/models/user.model';

@ObjectType()
export class Event {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => String)
  slug!: string;

  @Field(() => String, { nullable: true })
  location?: string | null;

  @Field(() => String, { nullable: true })
  logoUrl?: string | null;

  @Field(() => String, { nullable: true })
  coverUrl?: string | null;

  @Field(() => String, { nullable: true })
  coverImageUrl?: string | null;

  @Field(() => ID)
  organizationUnitId!: string;

  @Field(() => User, { nullable: true })
  organizer?: User | null;

  @Field(() => Date)
  startsAt!: Date;

  @Field(() => Date)
  endsAt!: Date;

  @Field(() => Boolean)
  isDeleted!: boolean;

  @Field(() => Int)
  shiftsCount!: number;

  @Field(() => Int)
  requiredFormsCount!: number;

  @Field(() => JoinStatus)
  myJoinStatus!: JoinStatus;

  @Field(() => [Shift])
  shifts!: Shift[];

  @Field(() => Date)
  createdAt!: Date;
}

export const EventPaginatedResponse = createPaginatedResponseType<Event>(
  Event,
  'Event',
);

export type EventPaginatedResponse = InstanceType<
  typeof EventPaginatedResponse
>;
