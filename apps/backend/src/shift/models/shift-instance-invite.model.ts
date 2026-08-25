import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
import { ShiftInviteOrigin, ShiftInviteStatus } from '../enums';

@ObjectType()
export class ShiftInstanceInvite {
  @Field(() => ID)
  id!: string;

  @Field(() => ShiftInviteOrigin, { nullable: true })
  origin?: ShiftInviteOrigin | null;

  @Field(() => ShiftInviteStatus, { nullable: true })
  status?: ShiftInviteStatus | null;

  @Field(() => String)
  userId!: string;

  @Field(() => User)
  user!: User;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
