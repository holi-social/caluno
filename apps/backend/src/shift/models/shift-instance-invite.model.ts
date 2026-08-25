import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
import { ShiftInviteStatus } from '../enums';

@ObjectType()
export class ShiftInstanceInvite {
  @Field(() => ID)
  id!: string;

  @Field(() => ShiftInviteStatus)
  status!: ShiftInviteStatus;

  @Field(() => String)
  userId!: string;

  @Field(() => User)
  user!: User;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
