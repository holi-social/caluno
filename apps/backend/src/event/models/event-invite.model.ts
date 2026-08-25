import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
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

  @Field(() => User)
  user!: User;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
