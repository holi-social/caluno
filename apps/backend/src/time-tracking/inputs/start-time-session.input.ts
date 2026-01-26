import { Field, InputType } from '@nestjs/graphql';
import { TimeSessionStatus } from '../enums';

@InputType()
export class StartTimeSessionInput {
  @Field(() => String)
  taskId: string;

  @Field(() => TimeSessionStatus, {
    defaultValue: TimeSessionStatus.IN_PROGRESS,
  })
  status: TimeSessionStatus;
}
