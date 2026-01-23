import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
import { Task } from '../models/task.model';
import { TaskService } from '../task.service';

@Resolver(() => Task)
export class TaskFieldResolver {
    constructor(private readonly taskService: TaskService) {}

    @ResolveField(() => [User])
    async assignees(@Parent() task: Task): Promise<User[]> {
        return this.taskService.findAssignees(task.id);
    }
}
