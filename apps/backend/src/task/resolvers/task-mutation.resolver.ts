import { Args, Mutation, Resolver } from '@nestjs/graphql';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Session } from '@thallesp/nestjs-better-auth';
import type { CreateTaskInput } from '../inputs/create-task.input';
import { Task } from '../models/task.model';
import type { TaskService } from '../task.service';

@Resolver(() => Task)
export class TaskMutationResolver {
  constructor(private readonly taskService: TaskService) {}

  @Mutation(() => Task)
  async createTask(
    @Args('input') input: CreateTaskInput,
    @Session() session: UserSession,
  ): Promise<Task> {
    return this.taskService.create(session.user.id, input);
  }
}
