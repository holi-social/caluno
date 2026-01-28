import { Field, InputType } from '@nestjs/graphql';
import { TaskStatus } from '../enums';

@InputType()
export class CreateTaskInput {
  @Field(() => String)
  title: string;

  @Field(() => String)
  description: string;

  @Field(() => String)
  organizationId: string;

  @Field(() => String)
  projectId: string;

  @Field(() => TaskStatus, { defaultValue: TaskStatus.TODO })
  status: TaskStatus;

  @Field(() => Date)
  dueDate: Date;
}
