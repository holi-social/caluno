import { Field, InputType } from '@nestjs/graphql';
import { VolunteerSessionStatus } from '../enums';

@InputType()
export class StartVolunteerSessionInput {
  @Field(() => String)
  shiftId: string;

  @Field(() => String)
  volunteerId: string;

  @Field(() => VolunteerSessionStatus, {
    defaultValue: VolunteerSessionStatus.SUBMITTED,
  })
  status: VolunteerSessionStatus;
}
