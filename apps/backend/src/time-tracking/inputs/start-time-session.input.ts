import { Field, InputType } from '@nestjs/graphql';
import { TimeSessionStatus } from '../models/time-session.model';

@InputType()
export class StartTimeSessionInput {
  @Field(() => String)
  taskId: string;

  @Field(() => TimeSessionStatus, {
    defaultValue: TimeSessionStatus.IN_PROGRESS,
  })
  status: TimeSessionStatus;
}
