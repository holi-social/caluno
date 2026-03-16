import { Inject, Injectable } from '@nestjs/common';
import type { UserEntity } from '../auth/schemas/auth.schema';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { NotFoundGraphQLError } from '../graphql/errors';
import type { PaginationInput } from '../graphql/pagination.input';
import { slugify } from '../utils';
import { CreateTaskInput } from './inputs/create-task.input';
import { CreateTaskAssignmentInput } from './inputs/create-task-assignment.input';
import { TaskMapper } from './mappers/task.mapper';
import { type Task, TaskPaginatedResponse } from './models/task.model';

@Injectable()
export class TaskService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly mapper: TaskMapper,
  ) {}

  async findById(id: string): Promise<Task | null> {
    const task = await this.db.query.tasks.findFirst({
      where: { id },
    });
    return this.mapper.toModel(task);
  }

  async findAllByProjectId(projectId: string): Promise<Task[]> {
    const tasks = await this.db.query.tasks.findMany({
      where: { projectId },
    });
    return this.mapper.toArray(tasks);
  }

  async findAllByUserId(
    userId: string,
    pagination: PaginationInput,
  ): Promise<TaskPaginatedResponse> {
    const tasks = await this.db.query.tasks.findMany({
      where: { createdById: userId },
    });

    return new TaskPaginatedResponse({
      items: this.mapper.toArray(tasks),
      total: tasks.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  async findAssignees(taskId: string): Promise<UserEntity[]> {
    const assignments = await this.db.query.taskAssignments.findMany({
      where: { taskId },
      with: {
        assignedTo: true,
      },
    });

    const assignees = assignments
      .map((assignment) => assignment.assignedTo)
      .filter((assignee): assignee is UserEntity => assignee !== null);
    return assignees;
  }

  async create(userId: string, input: CreateTaskInput): Promise<Task> {
    const [task] = await this.db
      .insert(schema.tasks)
      .values({
        ...input,
        slug: slugify(input.title),
        createdById: userId,
      })
      .returning();
    return this.mapper.toModelOrThrow(task);
  }

  async assignTask(
    userId: string,
    input: CreateTaskAssignmentInput,
  ): Promise<Task> {
    const task = await this.findById(input.taskId);

    if (!task) {
      throw new NotFoundGraphQLError('Task not found');
    }

    await this.db
      .insert(schema.taskAssignments)
      .values({
        taskId: input.taskId,
        assignedToId: input.assigneeId,
        assignedById: userId,
      })
      .returning();

    return task;
  }
}
