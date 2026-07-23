import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { EventInviteStatus } from '../enums';

registerEnumType(EventInviteStatus, {
  name: 'EventInviteStatus',
});

@ObjectType()
export class EventInvite {
  @Field(() => ID)
  id!: string;

  @Field(() => EventInviteStatus)
  status!: EventInviteStatus;

  @Field(() => String)
  userId!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
