import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { UserEntity } from '../auth/schemas/auth.schema';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import {
  BadRequestGraphQLError,
  ForbiddenGraphQLError,
  NotFoundGraphQLError,
} from '../graphql/errors';
import { MembershipService } from '../membership/membership.service';
import type { ShiftEntity } from '../shift/schemas/shift.schema';
import type { TaskEntity } from '../task/schemas/task.schema';
import { VolunteerSessionStatus } from './enums';
import { AddTimeEntryInput } from './inputs/add-time-entry.input';
import { ApproveVolunteerSessionInput } from './inputs/approve-volunteer-session.input';
import { RejectVolunteerSessionInput } from './inputs/reject-volunteer-session.input';
import { StartVolunteerSessionInput } from './inputs/start-volunteer-session.input';
import type { TimeEntryEntity } from './schemas/time-entry.schema';
import type { VolunteerSessionEntity } from './schemas/volunteer-session.schema';

@Injectable()
export class TimeTrackingService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    readonly _membershipService: MembershipService,
  ) {}
  async addTimeEntry(
    userId: string,
    input: AddTimeEntryInput,
  ): Promise<TimeEntryEntity> {
    const volunteerSession = await this.db.query.volunteerSessions.findFirst({
      where: { id: input.sessionId },
      with: {
        assignment: true,
      },
    });

    if (!volunteerSession) {
      throw new NotFoundGraphQLError('Volunteer session not found');
    }

    if (volunteerSession.assignment?.assignedToId !== userId) {
      throw new ForbiddenGraphQLError(
        'You are not authorized to add time entries to this volunteer session',
      );
    }

    const [timeEntry] = await this.db
      .insert(schema.timeEntries)
      .values(input)
      .returning();
    return timeEntry;
  }

  async startVolunteerSession(
    userId: string,
    input: StartVolunteerSessionInput,
  ): Promise<VolunteerSessionEntity> {
    const shift = await this.db.query.shifts.findFirst({
      where: { id: input.shiftId },
      with: {
        organization: true,
      },
    });

    if (!shift) {
      throw new NotFoundGraphQLError('Shift not found');
    }

    if (input.volunteerId !== userId) {
      throw new ForbiddenGraphQLError(
        'You are not authorized to create volunteer sessions for other users',
      );
    }

    // Create the volunteer session
    const [volunteerSession] = await this.db
      .insert(schema.volunteerSessions)
      .values({
        assignmentId: null,
        shiftId: input.shiftId,
        status: input.status,
      })
      .returning();
    return volunteerSession;
  }

  async endVolunteerSession(
    userId: string,
    id: string,
  ): Promise<VolunteerSessionEntity> {
    const volunteerSession = await this.db.query.volunteerSessions.findFirst({
      where: { id },
      with: {
        assignment: true,
      },
    });

    if (!volunteerSession) {
      throw new NotFoundGraphQLError('Volunteer session not found');
    }

    if (volunteerSession.assignment?.assignedToId !== userId) {
      throw new NotFoundGraphQLError('Volunteer session not found');
    }

    if (volunteerSession.status !== VolunteerSessionStatus.IN_PROGRESS) {
      throw new BadRequestGraphQLError(
        'Volunteer session must be in progress to be ended',
      );
    }

    const [updatedSession] = await this.db
      .update(schema.volunteerSessions)
      .set({ status: VolunteerSessionStatus.SUBMITTED })
      .where(eq(schema.volunteerSessions.id, id))
      .returning();
    return updatedSession;
  }

  async approveVolunteerSession(
    userId: string,
    input: ApproveVolunteerSessionInput,
  ): Promise<VolunteerSessionEntity> {
    const volunteerSession = await this.db.query.volunteerSessions.findFirst({
      where: { id: input.id },
    });

    if (!volunteerSession) {
      throw new NotFoundGraphQLError('Volunteer session not found');
    }

    if (volunteerSession.status !== VolunteerSessionStatus.SUBMITTED) {
      throw new BadRequestGraphQLError(
        'Volunteer session must be submitted for approval',
      );
    }

    const [approvedSession] = await this.db
      .update(schema.volunteerSessions)
      .set({
        status: VolunteerSessionStatus.APPROVED,
        validatedBy: userId,
        validatedAt: new Date(),
      })
      .where(eq(schema.volunteerSessions.id, input.id))
      .returning();
    return approvedSession;
  }

  async rejectVolunteerSession(
    userId: string,
    input: RejectVolunteerSessionInput,
  ): Promise<VolunteerSessionEntity> {
    const [rejectedSession] = await this.db
      .update(schema.volunteerSessions)
      .set({
        status: VolunteerSessionStatus.REJECTED,
        validatedBy: userId,
        validatedAt: new Date(),
        rejectionReason: input.rejectionReason,
      })
      .where(eq(schema.volunteerSessions.id, input.id))
      .returning();
    return rejectedSession;
  }

  async deleteTimeEntry(userId: string, id: string): Promise<TimeEntryEntity> {
    const timeEntry = await this.db.query.timeEntries.findFirst({
      where: { id },
      with: {
        session: {
          with: {
            assignment: true,
          },
        },
      },
    });

    if (!timeEntry) {
      throw new NotFoundGraphQLError('Time entry not found');
    }

    if (timeEntry.session?.assignment?.assignedToId !== userId) {
      throw new ForbiddenGraphQLError(
        'You are not authorized to delete this time entry',
      );
    }

    const [deletedTimeEntry] = await this.db
      .delete(schema.timeEntries)
      .where(eq(schema.timeEntries.id, id))
      .returning();
    return deletedTimeEntry;
  }

  async findEntriesBySessionId(
    userId: string,
    sessionId: string,
  ): Promise<TimeEntryEntity[]> {
    const entries = await this.db.query.timeEntries.findMany({
      where: { sessionId },
      with: {
        session: {
          with: {
            assignment: true,
          },
        },
      },
    });
    const userEntries = entries.filter(
      (entry) => entry.session?.assignment?.assignedToId === userId,
    );
    return userEntries;
  }

  async findTaskBySessionId(sessionId: string): Promise<TaskEntity> {
    const volunteerSession = await this.db.query.volunteerSessions.findFirst({
      where: { id: sessionId },
      with: {
        assignment: {
          with: {
            task: true,
          },
        },
      },
    });

    if (!volunteerSession) {
      throw new NotFoundGraphQLError('Volunteer session not found');
    }

    if (!volunteerSession.assignment?.task) {
      throw new NotFoundGraphQLError('Task not found');
    }

    return volunteerSession.assignment.task;
  }

  async findValidatorBySessionId(
    sessionId: string,
  ): Promise<UserEntity | null> {
    const volunteerSession = await this.db.query.volunteerSessions.findFirst({
      where: { id: sessionId },
      with: {
        validatedByRel: true,
        assignment: {
          with: {
            task: {
              with: {
                project: {
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

    if (!volunteerSession) {
      throw new NotFoundGraphQLError('Volunteer session not found');
    }

    return volunteerSession.validatedByRel;
  }

  async findAll(
    organizationId: string,
    status?: VolunteerSessionStatus,
  ): Promise<VolunteerSessionEntity[]> {
    const sessions = await this.db.query.volunteerSessions.findMany({
      where: status ? { status } : undefined,
      with: {
        shift: true,
        entries: true,
        validatedByRel: true,
      },
    });

    const filteredSessions = sessions.filter(
      (session) => session.shift?.organizationId === organizationId,
    );

    return filteredSessions;
  }

  async findShiftBySessionId(sessionId: string): Promise<ShiftEntity | null> {
    const volunteerSession = await this.db.query.volunteerSessions.findFirst({
      where: { id: sessionId },
      with: {
        shift: true,
      },
    });

    if (!volunteerSession) {
      throw new NotFoundGraphQLError('Volunteer session not found');
    }
    const organizationId = volunteerSession.shift?.organizationId;

    if (!organizationId) {
      throw new NotFoundGraphQLError('Organization not found for this session');
    }

    return volunteerSession.shift ?? null;
  }
}
