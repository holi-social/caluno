import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { Task } from '../models/task.model';
import { TaskService } from '../task.service';

@Resolver(() => Task)
export class TaskFieldResolver {
  constructor(
    private readonly taskService: TaskService,
    private readonly userMapper: UserMapper,
  ) {}

  @ResolveField(() => [User])
  async assignees(@Parent() task: Task): Promise<User[]> {
    const assignees = await this.taskService.findAssignees(task.id);
    return this.userMapper.toArray(assignees);
  }
}
