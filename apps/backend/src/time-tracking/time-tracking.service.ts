import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, lt } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
  ForbiddenGraphQLError,
  NotFoundGraphQLError,
} from '../graphql/errors';
import { MembershipService } from '../membership/membership.service';
import { AddTimeRecordInput } from './inputs/add-time-record.input';
import { ApproveTimeSessionInput } from './inputs/approve-time-session.input';
import { RejectTimeSessionInput } from './inputs/reject-time-session.input';
import { StartTimeSessionInput } from './inputs/start-time-session.input';
import { TimeRecordMapper } from './mappers/time-record.mapper';
import { TimeSessionMapper } from './mappers/time-session.mapper';
import { TimeRecord } from './models/time-record.model';
import { TimeSession } from './models/time-session.model';
import { TimeSessionStatus } from './enums';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { Task } from 'src/task/models/task.model';
import { TaskMapper } from 'src/task/mappers/task.mapper';
import { User } from 'src/user/models/user.model';
import { UserMapper } from 'src/user/mappers/user.mapper';

@Injectable()
export class TimeTrackingService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly membershipService: MembershipService,
    private readonly recordMapper: TimeRecordMapper,
    private readonly sessionMapper: TimeSessionMapper,
    private readonly taskMapper: TaskMapper,
    private readonly userMapper: UserMapper,
  ) {}
  async addTimeRecord(
    userId: string,
    input: AddTimeRecordInput,
  ): Promise<TimeRecord> {
    const timeSession = await this.db.query.timeSessions.findFirst({
      where: eq(schema.timeSessions.id, input.sessionId),
      with: {
        assignment: true,
      },
    });

    if (!timeSession) {
      throw new NotFoundGraphQLError('Time session not found');
    }

    if (timeSession.assignment?.assignedToId !== userId) {
      throw new ForbiddenGraphQLError(
        'You are not authorized to add time records to this time session',
      );
    }

    const [timeRecord] = await this.db
      .insert(schema.timeRecords)
      .values(input)
      .returning();
    return this.recordMapper.toModelOrThrow(timeRecord);
  }

  async startTimeSession(
    userId: string,
    input: StartTimeSessionInput,
  ): Promise<TimeSession> {
    const activeSessions = await this.db.query.timeSessions.findMany({
      where: inArray(schema.timeSessions.status, [
        TimeSessionStatus.IN_PROGRESS,
      ]),
      with: {
        assignment: true,
      },
    });

    const userActiveSession = activeSessions.find(
      (session) => session.assignment?.assignedToId === userId,
    );

    if (userActiveSession) {
      throw new ConflictGraphQLError('You already have an active time session');
    }

    const task = await this.db.query.tasks.findFirst({
      where: and(
        eq(schema.tasks.id, input.taskId),
        lt(schema.tasks.dueDate, new Date()),
      ),
    });

    if (!task) {
      throw new NotFoundGraphQLError('Task not found or is overdue');
    }

    const assignment = await this.db.query.taskAssignments.findFirst({
      where: and(
        eq(schema.taskAssignments.taskId, input.taskId),
        eq(schema.taskAssignments.assignedToId, userId),
      ),
    });

    if (!assignment) {
      throw new NotFoundGraphQLError('Task assignment not found');
    }

    const [timeSession] = await this.db
      .insert(schema.timeSessions)
      .values({
        assignmentId: assignment.id,
        status: input.status,
      })
      .returning();
    return this.sessionMapper.toModelOrThrow(timeSession);
  }

  async endTimeSession(userId: string, id: string): Promise<TimeSession> {
    const timeSession = await this.db.query.timeSessions.findFirst({
      where: eq(schema.timeSessions.id, id),
      with: {
        assignment: true,
      },
    });

    if (!timeSession) {
      throw new NotFoundGraphQLError('Time session not found');
    }

    if (timeSession.assignment?.assignedToId !== userId) {
      throw new NotFoundGraphQLError('Time session not found');
    }

    if (timeSession.status !== TimeSessionStatus.IN_PROGRESS) {
      throw new BadRequestGraphQLError(
        'Time session must be in progress to be ended',
      );
    }

    const [updatedSession] = await this.db
      .update(schema.timeSessions)
      .set({ status: TimeSessionStatus.SUBMITTED })
      .where(eq(schema.timeSessions.id, id))
      .returning();
    return this.sessionMapper.toModelOrThrow(updatedSession);
  }

  async approveTimeSession(
    userId: string,
    input: ApproveTimeSessionInput,
  ): Promise<TimeSession> {
    const isStaff = await this.membershipService.isStaff(
      userId,
      input.organizationId,
    );

    if (!isStaff) {
      throw new ForbiddenGraphQLError(
        'You are not authorized to approve time sessions',
      );
    }

    const timeSession = await this.db.query.timeSessions.findFirst({
      where: eq(schema.timeSessions.id, input.id),
    });

    if (!timeSession) {
      throw new NotFoundGraphQLError('Time session not found');
    }

    if (timeSession.status !== TimeSessionStatus.PENDING) {
      throw new BadRequestGraphQLError('Time session is not pending');
    }

    const [approvedSession] = await this.db
      .update(schema.timeSessions)
      .set({
        status: TimeSessionStatus.APPROVED,
        validatedBy: userId,
        validatedAt: new Date(),
      })
      .where(eq(schema.timeSessions.id, input.id))
      .returning();
    return this.sessionMapper.toModelOrThrow(approvedSession);
  }

  async rejectTimeSession(
    userId: string,
    input: RejectTimeSessionInput,
  ): Promise<TimeSession> {
    const isStaff = await this.membershipService.isStaff(
      userId,
      input.organizationId,
    );
    if (!isStaff) {
      throw new ForbiddenGraphQLError(
        'You are not authorized to reject time sessions',
      );
    }
    const [rejectedSession] = await this.db
      .update(schema.timeSessions)
      .set({
        status: TimeSessionStatus.REJECTED,
        validatedBy: userId,
        validatedAt: new Date(),
        rejectionReason: input.rejectionReason,
      })
      .where(eq(schema.timeSessions.id, input.id))
      .returning();
    return this.sessionMapper.toModelOrThrow(rejectedSession);
  }

  async deleteTimeRecord(userId: string, id: string): Promise<TimeRecord> {
    const timeRecord = await this.db.query.timeRecords.findFirst({
      where: eq(schema.timeRecords.id, id),
      with: {
        session: {
          with: {
            assignment: true,
          },
        },
      },
    });

    if (!timeRecord) {
      throw new NotFoundGraphQLError('Time record not found');
    }

    if (timeRecord.session?.assignment?.assignedToId !== userId) {
      throw new ForbiddenGraphQLError(
        'You are not authorized to delete this time record',
      );
    }

    const [deletedTimeRecord] = await this.db
      .delete(schema.timeRecords)
      .where(eq(schema.timeRecords.id, id))
      .returning();
    return this.recordMapper.toModelOrThrow(deletedTimeRecord);
  }

  async findRecordsBySessionId(
    userId: string,
    sessionId: string,
  ): Promise<TimeRecord[]> {
    const records = await this.db.query.timeRecords.findMany({
      where: eq(schema.timeRecords.sessionId, sessionId),
      with: {
        session: {
          with: {
            assignment: true,
          },
        },
      },
    });
    const userRecords = records.filter(
      (record) => record.session?.assignment?.assignedToId === userId,
    );
    return this.recordMapper.toArray(userRecords);
  }

  async findTaskBySessionId(userId: string, sessionId: string): Promise<Task> {
    const timeSession = await this.db.query.timeSessions.findFirst({
      where: eq(schema.timeSessions.id, sessionId),
      with: {
        assignment: {
          with: {
            task: true,
          },
        },
      },
    });

    if (!timeSession) {
      throw new NotFoundGraphQLError('Time session not found');
    }

    if (timeSession.assignment?.assignedToId !== userId) {
      throw new ForbiddenGraphQLError(
        'You are not authorized to access this task',
      );
    }

    return this.taskMapper.toModelOrThrow(timeSession.assignment?.task);
  }

  async findValidatorBySessionId(
    userId: string,
    sessionId: string,
  ): Promise<User | null> {
    const timeSession = await this.db.query.timeSessions.findFirst({
      where: eq(schema.timeSessions.id, sessionId),
      with: {
        validatedBy: true,
        assignment: {
          with: {
            task: {
              with: {
                opportunity: {
                  with: {
                    organization: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!timeSession) {
      throw new NotFoundGraphQLError('Time session not found');
    }

    const isStaff = await this.membershipService.isStaff(
      userId,
      timeSession.assignment?.task?.opportunity?.organization?.id ?? '',
    );

    if (timeSession.assignment?.assignedToId !== userId || !isStaff) {
      throw new ForbiddenGraphQLError(
        'You are not authorized to access this time session',
      );
    }

    return this.userMapper.toModel(timeSession.validatedBy);
  }
}
