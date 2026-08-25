import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ShiftInviteOrigin, ShiftInviteStatus } from '../enums';

@ObjectType()
export class ShiftInvite {
  @Field(() => ID)
  id!: string;

  @Field(() => ShiftInviteOrigin, { nullable: true })
  origin?: ShiftInviteOrigin | null;

  @Field(() => ShiftInviteStatus, { nullable: true })
  status?: ShiftInviteStatus | null;

  @Field(() => String)
  userId!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
