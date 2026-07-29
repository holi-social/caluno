import { Inject, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { and, count, eq, inArray } from 'drizzle-orm';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import type { UserEntity } from '../database/schema';
import * as schema from '../database/schema';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
  NotFoundGraphQLError,
} from '../graphql/errors';
import type { PaginationInput } from '../graphql/pagination.input';
import { MembershipService } from '../membership/membership.service';
import type { MembershipRequestEntity } from '../membership/schemas/membership-request.schema';
import type { RequirementFormEntity } from '../requirement-profile/schemas/requirement-form.schema';
import type { RequirementProfileEntity } from '../requirement-profile/schemas/requirement-profile.schema';
import { JoinStatus } from '../shared/enums/join-status.enum';
import {
  canTransitionInviteStatus,
  PARTICIPATING_EVENT_INVITE_STATUSES,
} from '../shared/invite-status';
import { FilePurpose } from '../storage/enums';
import { FileService } from '../storage/services/file.service';
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
    private readonly membershipService: MembershipService,
    private readonly fileService: FileService,
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

  async findByIdPublic(identifier: string): Promise<EventEntity | null> {
    if (isUUID(identifier)) {
      const event = await this.db.query.events.findFirst({
        where: { id: identifier, isDeleted: false },
      });
      if (event) {
        return event;
      }
    }

    const event = await this.db.query.events.findFirst({
      where: { slug: identifier, isDeleted: false },
    });
    return event ?? null;
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

  /** Public (non-deleted) events for an org unit, no pagination. */
  async findAllPublicByOrgUnit(
    organizationUnitId: string,
  ): Promise<EventEntity[]> {
    return this.db.query.events.findMany({
      where: { organizationUnitId, isDeleted: false },
      orderBy: { startsAt: 'asc' },
    });
  }

  async create(
    userId: string,
    organizationUnitId: string,
    input: CreateEventInput,
  ): Promise<EventEntity> {
    const { invitedMemberIds, logoFileId, coverFileId, ...eventInput } = input;
    const logoUrl = logoFileId
      ? await this.resolveImageUrl(logoFileId, FilePurpose.EVENT_IMAGE)
      : null;
    const coverUrl = coverFileId
      ? await this.resolveImageUrl(coverFileId, FilePurpose.EVENT_IMAGE)
      : null;

    return this.db.transaction(async (tx) => {
      const [event] = await tx
        .insert(schema.events)
        .values({
          title: eventInput.title,
          slug: slugify(eventInput.title),
          description: eventInput.description,
          location: eventInput.location,
          logoUrl,
          coverUrl,
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
              status: EventInviteStatus.INVITED,
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

    const resolved = await this.resolveEventUpdateInput(input);

    const [event] = await this.db
      .update(schema.events)
      .set({
        title: resolved.title,
        slug: resolved.title ? slugify(resolved.title) : undefined,
        description: resolved.description,
        location: resolved.location,
        logoUrl: resolved.logoUrl,
        coverUrl: resolved.coverUrl,
        startsAt: resolved.startsAt,
        endsAt: resolved.endsAt,
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
          status: EventInviteStatus.INVITED,
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

    const existingInvite = await db.query.eventInvites.findFirst({
      where: { eventId, userId },
    });

    if (existingInvite) {
      if (
        !canTransitionInviteStatus(
          existingInvite.status,
          EventInviteStatus.ACCEPTED,
        )
      ) {
        throw new BadRequestGraphQLError(
          `Cannot transition invite status from ${existingInvite.status} to ${EventInviteStatus.ACCEPTED}`,
        );
      }

      if (existingInvite.status === EventInviteStatus.ACCEPTED) {
        return event;
      }

      await db
        .update(schema.eventInvites)
        .set({ status: EventInviteStatus.ACCEPTED })
        .where(eq(schema.eventInvites.id, existingInvite.id));

      return event;
    }

    await db
      .insert(schema.eventInvites)
      .values({
        eventId,
        userId,
        status: EventInviteStatus.ACCEPTED,
      })
      .onConflictDoNothing();

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
    requiredForms?: Array<{
      form: RequirementFormEntity;
      order: number;
      submitted: boolean;
      submissionId: string | null;
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
          requiredForms: result.requiredForms,
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

  async updateEventInviteStatus(
    userId: string,
    eventId: string,
    status: EventInviteStatus,
  ): Promise<EventInviteEntity> {
    const event = await this.db.query.events.findFirst({
      where: { id: eventId, isDeleted: false },
    });

    if (!event) {
      throw new NotFoundGraphQLError('Event not found');
    }

    const invite = await this.findInvite(eventId, userId);

    if (!invite) {
      throw new NotFoundGraphQLError('Event invite not found');
    }

    if (invite.status === status) {
      return invite;
    }

    if (!canTransitionInviteStatus(invite.status, status)) {
      throw new BadRequestGraphQLError(
        `Cannot transition invite status from ${invite.status} to ${status}`,
      );
    }

    const [updated] = await this.db
      .update(schema.eventInvites)
      .set({ status })
      .where(eq(schema.eventInvites.id, invite.id))
      .returning();

    return updated;
  }

  async findInvite(
    eventId: string,
    userId: string,
  ): Promise<EventInviteEntity | undefined> {
    return this.db.query.eventInvites.findFirst({
      where: {
        eventId,
        userId,
      },
    });
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
          status: { in: [...PARTICIPATING_EVENT_INVITE_STATUSES] },
        },
      },
    });
  }

  private async resolveImageUrl(
    fileId: string,
    purpose: FilePurpose,
  ): Promise<string> {
    await this.fileService.assertUploadedFileForPurpose(fileId, purpose);
    return this.fileService.resolvePublicUrlForUploadedFile(fileId);
  }

  private async resolveEventUpdateInput(input: UpdateEventInput): Promise<{
    title?: string;
    description?: string | null;
    location?: string | null;
    logoUrl?: string | null;
    coverUrl?: string | null;
    startsAt?: Date;
    endsAt?: Date;
  }> {
    const { logoFileId, coverFileId, ...rest } = input;

    const logoUrl =
      logoFileId === undefined
        ? undefined
        : logoFileId
          ? await this.resolveImageUrl(logoFileId, FilePurpose.EVENT_IMAGE)
          : null;

    const coverUrl =
      coverFileId === undefined
        ? undefined
        : coverFileId
          ? await this.resolveImageUrl(coverFileId, FilePurpose.EVENT_IMAGE)
          : null;

    return {
      ...rest,
      ...(logoUrl !== undefined ? { logoUrl } : {}),
      ...(coverUrl !== undefined ? { coverUrl } : {}),
    };
  }
}
