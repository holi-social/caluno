import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import type { PaginationInput } from '../graphql/pagination.input';
import type { UserMapper } from '../user/mappers/user.mapper';
import type { User } from '../user/models/user.model';
import { slugify } from '../utils';
import type { CreateTaskInput } from './inputs/create-task.input';
import type { TaskMapper } from './mappers/task.mapper';
import { type Task, TaskPaginatedResponse } from './models/task.model';

@Injectable()
export class TaskService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly mapper: TaskMapper,
    private readonly userMapper: UserMapper,
  ) {}

  async findById(id: string): Promise<Task | null> {
    const task = await this.db.query.tasks.findFirst({
      where: eq(schema.tasks.id, id),
    });
    return this.mapper.toModel(task);
  }

  async findAllByOpportunityId(opportunityId: string): Promise<Task[]> {
    const tasks = await this.db.query.tasks.findMany({
      where: eq(schema.tasks.opportunityId, opportunityId),
    });
    return this.mapper.toArray(tasks);
  }

  async findAllByUserId(
    userId: string,
    pagination: PaginationInput,
  ): Promise<TaskPaginatedResponse> {
    const tasks = await this.db.query.tasks.findMany({
      where: eq(schema.tasks.createdById, userId),
    });

    return new TaskPaginatedResponse({
      items: this.mapper.toArray(tasks),
      total: tasks.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  async findAssignees(taskId: string): Promise<User[]> {
    const assignments = await this.db.query.taskAssignments.findMany({
      where: eq(schema.taskAssignments.taskId, taskId),
      with: {
        assignedTo: true,
      },
    });

    const assignees = assignments.map((assignment) => assignment.assignedTo);
    return this.userMapper.toArray(assignees);
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
}
