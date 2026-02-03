import { Field, InputType } from '@nestjs/graphql';
import { VolunteerSessionStatus } from '../enums';

@InputType()
export class StartVolunteerSessionInput {
  @Field(() => String)
  taskId: string;

  @Field(() => VolunteerSessionStatus, {
    defaultValue: VolunteerSessionStatus.IN_PROGRESS,
  })
  status: VolunteerSessionStatus;
}
