import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
import { EventInviteOrigin, EventInviteStatus } from '../enums';

registerEnumType(EventInviteOrigin, {
  name: 'EventInviteOrigin',
});

registerEnumType(EventInviteStatus, {
  name: 'EventInviteStatus',
});

@ObjectType()
export class EventInvite {
  @Field(() => ID)
  id!: string;

  @Field(() => EventInviteOrigin, { nullable: true })
  origin?: EventInviteOrigin | null;

  @Field(() => EventInviteStatus, { nullable: true })
  status?: EventInviteStatus | null;

  @Field(() => String)
  userId!: string;

  @Field(() => User)
  user!: User;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
