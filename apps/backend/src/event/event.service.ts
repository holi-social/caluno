import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, inArray } from 'drizzle-orm';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import type { UserEntity } from '../database/schema';
import * as schema from '../database/schema';
import { ConflictGraphQLError, NotFoundGraphQLError } from '../graphql/errors';
import type { PaginationInput } from '../graphql/pagination.input';
import { MembershipService } from '../membership/membership.service';
import type { MembershipRequestEntity } from '../membership/schemas/membership-request.schema';
import { NotificationService } from '../notification/notification.service';
import type { RequirementProfileEntity } from '../requirement-profile/schemas/requirement-profile.schema';
import { JoinStatus } from '../shared/enums/join-status.enum';
import { UserService } from '../user/user.service';
import { slugify } from '../utils/slug.util';
import { EventInviteStatus } from './enums';
import { CreateEventInput } from './inputs/create-event.input';
import { UpdateEventInput } from './inputs/update-event.input';
import type { EventEntity } from './schemas/event.schema';
import type { EventInviteEntity } from './schemas/event-invite.schema';

@Injectable()
export class EventService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly userService: UserService,
    private readonly membershipService: MembershipService,
  ) {}

  async findById(id: string, organizationUnitId: string): Promise<EventEntity> {
    const event = await this.db.query.events.findFirst({
      where: { id, organizationUnitId, isDeleted: false },
    });

    if (!event) {
      throw new NotFoundGraphQLError(`Event with ID ${id} not found`);
    }
    return event;
  }

  async findByIdPublic(id: string): Promise<EventEntity | null> {
    const result = await this.db.query.events.findFirst({
      where: { id, isDeleted: false },
    });
    return result ?? null;
  }

  async findAll(
    organizationUnitId: string,
    pagination: PaginationInput,
  ): Promise<{ events: EventEntity[]; total: number }> {
    const events = await this.db.query.events.findMany({
      where: {
        organizationUnitId,
        isDeleted: false,
      },
      orderBy: { startsAt: 'asc' },
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const totalResult = await this.db.query.events.findMany({
      where: {
        organizationUnitId,
        isDeleted: false,
      },
      columns: {},
      extras: { total: count() },
    });

    return { events, total: totalResult[0]?.total ?? 0 };
  }

  async create(
    userId: string,
    organizationUnitId: string,
    input: CreateEventInput,
  ): Promise<EventEntity> {
    const { invitedMemberIds, ...eventInput } = input;

    return this.db.transaction(async (tx) => {
      const [event] = await tx
        .insert(schema.events)
        .values({
          title: eventInput.title,
          slug: slugify(eventInput.title),
          location: eventInput.location,
          logoUrl: eventInput.logoUrl,
          coverUrl: eventInput.coverUrl,
          startsAt: eventInput.startsAt,
          endsAt: eventInput.endsAt,
          organizationUnitId,
          createdById: userId,
        })
        .returning();

      if (!event) {
        throw new Error('Could not create event');
      }

      if (invitedMemberIds && invitedMemberIds.length > 0) {
        await tx
          .insert(schema.eventInvites)
          .values(
            invitedMemberIds.map((memberId) => ({
              eventId: event.id,
              userId: memberId,
              status: EventInviteStatus.ACCEPTED,
            })),
          )
          .onConflictDoNothing();
      }

      return event;
    });
  }

  async update(
    id: string,
    organizationUnitId: string,
    input: UpdateEventInput,
  ): Promise<EventEntity> {
    const existingEvent = await this.db.query.events.findFirst({
      where: { id, organizationUnitId, isDeleted: false },
    });

    if (!existingEvent) {
      throw new NotFoundGraphQLError(`Event with ID ${id} not found`);
    }

    const [event] = await this.db
      .update(schema.events)
      .set({
        title: input.title,
        slug: input.title ? slugify(input.title) : undefined,
        location: input.location,
        logoUrl: input.logoUrl,
        coverUrl: input.coverUrl,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      })
      .where(
        and(
          eq(schema.events.id, id),
          eq(schema.events.organizationUnitId, organizationUnitId),
        ),
      )
      .returning();

    if (!event) {
      throw new NotFoundGraphQLError(`Event with ID ${id} not found`);
    }

    return event;
  }

  async delete(id: string, organizationUnitId: string): Promise<EventEntity> {
    const [event] = await this.db
      .update(schema.events)
      .set({ isDeleted: true })
      .where(
        and(
          eq(schema.events.id, id),
          eq(schema.events.organizationUnitId, organizationUnitId),
        ),
      )
      .returning();

    if (!event) {
      throw new NotFoundGraphQLError(`Event with ID ${id} not found`);
    }

    return event;
  }

  async findOrganizer(createdById: string): Promise<UserEntity> {
    return this.userService.findByIdOrThrow(createdById);
  }

  async inviteMembersToEvent(
    eventId: string,
    memberIds: string[],
    organizationUnitId: string,
  ): Promise<EventEntity> {
    const event = await this.findById(eventId, organizationUnitId);

    if (memberIds.length === 0) {
      return event;
    }

    const existing = await this.db
      .select({ userId: schema.eventInvites.userId })
      .from(schema.eventInvites)
      .where(
        and(
          eq(schema.eventInvites.eventId, eventId),
          inArray(schema.eventInvites.userId, memberIds),
        ),
      );

    const alreadyInvited = new Set(existing.map((row) => row.userId));
    const newMemberIds = memberIds.filter((id) => !alreadyInvited.has(id));

    if (newMemberIds.length === 0) {
      return event;
    }

    await this.db
      .insert(schema.eventInvites)
      .values(
        newMemberIds.map((userId) => ({
          eventId,
          userId,
          status: EventInviteStatus.ACCEPTED,
        })),
      )
      .onConflictDoNothing();

    return event;
  }

  async joinEvent(
    userId: string,
    eventId: string,
    tx?: Database,
  ): Promise<EventEntity> {
    const db = tx ?? this.db;

    const event = await db.query.events.findFirst({
      where: { id: eventId, isDeleted: false },
    });

    if (!event) {
      throw new NotFoundGraphQLError('Event not found');
    }

    const isAllowed = await this.membershipService.isMemberOfUnitOrAncestor(
      userId,
      event.organizationUnitId,
    );

    if (!isAllowed) {
      throw new ConflictGraphQLError(
        'You must be a member of the organization to join this event.',
      );
    }

    await db
      .insert(schema.eventInvites)
      .values({
        eventId,
        userId,
        status: EventInviteStatus.ACCEPTED,
      })
      .onConflictDoUpdate({
        target: [schema.eventInvites.eventId, schema.eventInvites.userId],
        set: { status: EventInviteStatus.ACCEPTED },
      });

    return event;
  }

  async requestJoinEvent(
    userId: string,
    eventId: string,
  ): Promise<{
    status: JoinStatus;
    event: EventEntity;
    membershipRequest?: MembershipRequestEntity;
    requirementProfile?: RequirementProfileEntity;
    requirementStatuses?: Array<{
      requirementId: string;
      name: string;
      status: string;
    }>;
  }> {
    const event = await this.findByIdPublic(eventId);

    if (!event) {
      throw new NotFoundGraphQLError('Event not found');
    }

    const orgUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: event.organizationUnitId },
    });

    if (!orgUnit) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    const isAllowed = await this.membershipService.isMemberOfUnitOrAncestor(
      userId,
      orgUnit.id,
    );

    if (!isAllowed) {
      const result = await this.membershipService.requestOrgJoin(
        userId,
        orgUnit.id,
        undefined,
        eventId,
      );

      if (result.status === 'REQUIREMENTS_NEEDED') {
        return {
          status: JoinStatus.REQUIREMENTS_NEEDED,
          event,
          requirementProfile: result.requirementProfile,
          requirementStatuses: result.requirementStatuses,
        };
      }

      if (result.status === 'PENDING') {
        return {
          status: JoinStatus.PENDING,
          event,
          membershipRequest: result.membershipRequest,
        };
      }

      if (result.status === 'REJECTED') {
        return {
          status: JoinStatus.REJECTED,
          event,
          membershipRequest: result.membershipRequest,
        };
      }

      await this.joinEvent(userId, eventId);
      return {
        status: JoinStatus.JOINED,
        event,
      };
    }

    await this.joinEvent(userId, eventId);
    return {
      status: JoinStatus.JOINED,
      event,
    };
  }

  async findInvites(
    eventId: string,
    organizationUnitId: string,
  ): Promise<EventInviteEntity[]> {
    await this.findById(eventId, organizationUnitId);

    return this.db.query.eventInvites.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAttendees(
    eventId: string,
    organizationUnitId: string,
  ): Promise<UserEntity[]> {
    await this.findById(eventId, organizationUnitId);

    return this.db.query.users.findMany({
      where: {
        eventInvites: {
          eventId,
          status: EventInviteStatus.ACCEPTED,
        },
      },
    });
  }
}
