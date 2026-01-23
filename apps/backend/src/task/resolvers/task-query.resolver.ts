import { Args, Query, Resolver } from '@nestjs/graphql';

import { Task } from '../models/task.model';
import type { TaskService } from '../task.service';

@Resolver(() => Task)
export class TaskQueryResolver {
  constructor(private readonly taskService: TaskService) {}

  @Query(() => Task)
  async task(@Args('id') id: string): Promise<Task | null> {
    return this.taskService.findById(id);
  }
}
