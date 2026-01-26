import { Args, Query, Resolver } from '@nestjs/graphql';

import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Session } from '@thallesp/nestjs-better-auth';
import { PaginationInput } from '../../graphql/pagination.input';
import { Task, TaskPaginatedResponse } from '../models/task.model';
import { TaskService } from '../task.service';

@Resolver(() => Task)
export class TaskQueryResolver {
  constructor(private readonly taskService: TaskService) {}

  @Query(() => Task)
  async task(@Args('id') id: string): Promise<Task | null> {
    return this.taskService.findById(id);
  }

  @Query(() => TaskPaginatedResponse)
  async tasksByUserId(
    @Args('userId') userId: string,
    @Args() pagination: PaginationInput,
  ): Promise<TaskPaginatedResponse> {
    return this.taskService.findAllByUserId(userId, pagination);
  }

  @Query(() => TaskPaginatedResponse)
  myTasks(
    @Session() session: UserSession,
    @Args() pagination: PaginationInput,
  ): Promise<TaskPaginatedResponse> {
    return this.taskService.findAllByUserId(session.user.id, pagination);
  }
}
