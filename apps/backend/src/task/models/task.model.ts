import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { Opportunity } from '../../opportunity/models/opportunity.model';
import { User } from '../../user/models/user.model';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED',
}

registerEnumType(TaskStatus, {
  name: 'TaskStatus',
});

@ObjectType()
export class Task {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  slug: string;

  @Field(() => String)
  description: string;

  @Field(() => Opportunity)
  opportunity: Opportunity;

  @Field(() => TaskStatus)
  status: TaskStatus;

  @Field(() => [User], { nullable: true })
  assignees: User[];

  @Field(() => User)
  createdBy: User;

  @Field(() => Date)
  dueDate: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  updatedAt: Date;
}

export const TaskPaginatedResponse = createPaginatedResponseType<Task>(
  Task,
  'Task',
);

export type TaskPaginatedResponse = InstanceType<typeof TaskPaginatedResponse>;
