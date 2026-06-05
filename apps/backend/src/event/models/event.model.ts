import { Field, ID, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { User } from '../../user/models/user.model';

@ObjectType()
export class Event {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String, { nullable: true })
  location!: string | null;

  @Field(() => String, { nullable: true })
  logoUrl!: string | null;

  @Field(() => String, { nullable: true })
  coverUrl!: string | null;

  @Field(() => ID)
  organizationUnitId!: string;

  @Field(() => User, { nullable: true })
  organizer!: User | null;

  @Field(() => Date)
  startsAt!: Date;

  @Field(() => Date)
  endsAt!: Date;

  @Field(() => Boolean)
  isDeleted!: boolean;

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
