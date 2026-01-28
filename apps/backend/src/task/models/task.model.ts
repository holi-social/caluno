import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { Project } from '../../project/models/project.model';
import { User } from '../../user/models/user.model';
import { TaskStatus } from '../enums';

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

  @Field(() => Project)
  project: Project;

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
