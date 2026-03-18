import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Shift } from '../../shift/models/shift.model';
import { User } from '../../user/models/user.model';
import { VolunteerSessionStatus } from '../enums';
import { TimeEntry } from './time-entry.model';

registerEnumType(VolunteerSessionStatus, {
  name: 'VolunteerSessionStatus',
});

@ObjectType()
export class VolunteerSession {
  @Field(() => ID)
  id: string;

  @Field(() => User)
  user: User;

  @Field(() => Shift, { nullable: true })
  shift: Shift | null;

  @Field(() => VolunteerSessionStatus)
  status: VolunteerSessionStatus;

  @Field(() => [TimeEntry])
  entries: TimeEntry[];

  @Field(() => User, { nullable: true })
  validatedBy: User | null;

  @Field(() => Date, { nullable: true })
  validatedAt: Date | null;

  @Field(() => String, { nullable: true })
  rejectionReason: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  updatedAt: Date;
}
