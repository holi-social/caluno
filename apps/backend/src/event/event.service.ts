import { Inject, Injectable, Logger } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { and, count, eq, inArray } from 'drizzle-orm';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/constants';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
  NotFoundGraphQLError,
} from '../graphql/errors';
import type { PaginationInput } from '../graphql/pagination.input';
import { MembershipService } from '../membership/membership.service';
import type { MembershipRequestEntity } from '../membership/schemas/membership-request.schema';
import { NotificationService } from '../notification/notification.service';
import { OrganizationService } from '../organization/organization.service';
import { RequiredFormTargetType } from '../requirement-profile/enums';
import type { RequirementProfileEntity } from '../requirement-profile/schemas/requirement-profile.schema';
import {
  RequiredFormService,
  type RequiredFormStatus,
} from '../requirement-profile/services/required-form.service';
import { JoinStatus } from '../shared/enums/join-status.enum';
import {
  ACTIVE_INVITE_WHERE,
  ADMIN_LIST_INVITE_WHERE,
  activeInviteSql,
  canTransitionInvite,
  isAdminEndedInvite,
  isParticipatingInvite,
  myInviteFilterWhere,
  PARTICIPATING_INVITE_WHERE,
  reinviteTarget,
} from '../shared/invite-status';
import { SortOrder } from '../shift/enums';
import { ShiftService } from '../shift/shift.service';
import { FilePurpose } from '../storage/enums';
import { FileService } from '../storage/services/file.service';
import { slugify } from '../utils/slug.util';
import { EventInviteOrigin, EventInviteStatus } from './enums';
import { CreateEventInput } from './inputs/create-event.input';
import { UpdateEventInput } from './inputs/update-event.input';
import type { EventEntity } from './schemas/event.schema';
import type { EventInviteEntity } from './schemas/event-invite.schema';

const EMPTY_EVENT_PAGE: { events: EventEntity[]; total: number } = {
  events: [],
  total: 0,
};

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly membershipService: MembershipService,
    private readonly organizationService: OrganizationService,
    private readonly fileService: FileService,
    private readonly requiredFormService: RequiredFormService,
    private readonly shiftService: ShiftService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
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

  async findBySlug(slug: string): Promise<EventEntity | null> {
    const result = await this.db.query.events.findFirst({
      where: { slug, isDeleted: false },
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

  /** Public (non-deleted) events for an org unit, no pagination. */
  async findAllPublicByOrgUnit(
    organizationUnitId: string,
  ): Promise<EventEntity[]> {
    return this.db.query.events.findMany({
      where: { organizationUnitId, isDeleted: false },
      orderBy: { startsAt: 'asc' },
    });
  }

  /**
   * Events the session user has an invite for across accessible org units.
   * Same contract as `ShiftService.findMyShiftInstances` — default statuses are
   * participating; pass `waiting: true` for the volunteer Invitations list.
   */
  async findMyEvents(
    userId: string,
    includePast: boolean,
    startsAfter: Date | null,
    endsBefore: Date | null,
    limit: number,
    offset: number,
    order: SortOrder,
    statuses?: readonly EventInviteStatus[],
    waiting = false,
  ): Promise<{ events: EventEntity[]; total: number }> {
    const organizationUnitIds =
      await this.getAccessibleOrganizationUnitIds(userId);

    if (organizationUnitIds.length === 0) {
      return EMPTY_EVENT_PAGE;
    }

    const dateCondition = this.buildMyEventDateCondition(
      includePast,
      startsAfter,
      endsBefore,
    );

    const where = {
      isDeleted: false,
      organizationUnitId: { in: organizationUnitIds },
      ...dateCondition,
      invites: {
        userId,
        ...myInviteFilterWhere(statuses, waiting),
      },
    };

    const orderBy = {
      startsAt: order.toLowerCase() as 'asc' | 'desc',
    };

    const [events, totalResult] = await Promise.all([
      this.db.query.events.findMany({
        where,
        orderBy,
        limit,
        offset,
      }),
      this.db.query.events.findMany({
        where,
        columns: {},
        extras: { total: count() },
      }),
    ]);

    return { events, total: totalResult[0]?.total ?? 0 };
  }

  /**
   * Discoverable events across the volunteer's accepted **and** pending org
   * units — the event-side analogue of `ShiftService.findAvailableShiftInstances`.
   * `Event` has no `visibility` column (unlike `Shift`'s ALL_MEMBERS/INVITED_MEMBERS),
   * so there is no accepted/pending visibility split to mirror: both sets are
   * simply unioned into one accessible-org-unit list.
   */
  async findAvailableEvents(
    userId: string,
    startsAfter: Date | null,
    endsBefore: Date | null,
    organizationUnitIds: string[] | null,
    limit: number,
    offset: number,
  ): Promise<{ events: EventEntity[]; total: number }> {
    const [acceptedOrganizationUnitIds, pendingOrganizationUnitIds] =
      await Promise.all([
        this.getAccessibleOrganizationUnitIds(userId),
        this.membershipService.getPendingOrganizationUnitIds(userId),
      ]);

    const accessibleOrganizationUnitIds = [
      ...new Set([
        ...acceptedOrganizationUnitIds,
        ...pendingOrganizationUnitIds,
      ]),
    ];

    if (accessibleOrganizationUnitIds.length === 0) {
      return EMPTY_EVENT_PAGE;
    }

    const requestedOrgUnitIds = organizationUnitIds?.length
      ? organizationUnitIds.filter((id) =>
          accessibleOrganizationUnitIds.includes(id),
        )
      : accessibleOrganizationUnitIds;

    if (requestedOrgUnitIds.length === 0) {
      return EMPTY_EVENT_PAGE;
    }

    const dateCondition = this.buildMyEventDateCondition(
      false,
      startsAfter,
      endsBefore,
    );

    const where = {
      isDeleted: false,
      organizationUnitId: { in: requestedOrgUnitIds },
      ...dateCondition,
      NOT: {
        invites: {
          userId,
          ...PARTICIPATING_INVITE_WHERE,
        },
      },
    };

    // Tie-break on id so events sharing the same startsAt keep a stable
    // order across pages, matching findAvailableShiftInstances.
    const orderBy = { startsAt: 'asc' as const, id: 'asc' as const };

    const [events, totalResult] = await Promise.all([
      this.db.query.events.findMany({
        where,
        orderBy,
        limit,
        offset,
      }),
      this.db.query.events.findMany({
        where,
        columns: {},
        extras: { total: count() },
      }),
    ]);

    return { events, total: totalResult[0]?.total ?? 0 };
  }

  private async getAccessibleOrganizationUnitIds(
    userId: string,
  ): Promise<string[]> {
    const units = await this.organizationService.findUnits(userId);
    return units.map((unit) => unit.id);
  }

  private buildMyEventDateCondition(
    includePast: boolean,
    startsAfter: Date | null,
    endsBefore: Date | null,
  ): Record<string, unknown> {
    if (endsBefore) {
      return { endsAt: { lt: endsBefore } };
    }

    if (startsAfter) {
      return { startsAt: { gte: startsAfter } };
    }

    if (!includePast) {
      return { endsAt: { gte: new Date() } };
    }

    return {};
  }

  async create(
    userId: string,
    organizationUnitId: string,
    input: CreateEventInput,
  ): Promise<EventEntity> {
    const {
      invitedMemberIds,
      requiredFormIds,
      logoFileId,
      coverFileId,
      ...eventInput
    } = input;
    const logoUrl = logoFileId
      ? await this.resolveImageUrl(logoFileId, FilePurpose.EVENT_IMAGE)
      : null;
    const coverUrl = coverFileId
      ? await this.resolveImageUrl(coverFileId, FilePurpose.EVENT_IMAGE)
      : null;

    const event = await this.db.transaction(async (tx) => {
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
              origin: EventInviteOrigin.ADMIN_INVITED,
              status: null,
            })),
          )
          .onConflictDoNothing();
      }

      if (requiredFormIds && requiredFormIds.length > 0) {
        await this.setRequiredFormsInTx(
          tx,
          event.id,
          organizationUnitId,
          requiredFormIds,
        );
      }

      return event;
    });

    if (invitedMemberIds && invitedMemberIds.length > 0) {
      void this.loadAndEmitEventInvitedNotification(event, invitedMemberIds);
    }

    return event;
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

    return this.db.transaction(async (tx) => {
      const [event] = await tx
        .update(schema.events)
        .set({
          title: resolved.title,
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

      if (input.requiredFormIds !== undefined) {
        await this.setRequiredFormsInTx(
          tx,
          event.id,
          organizationUnitId,
          input.requiredFormIds ?? [],
        );
      }

      return event;
    });
  }

  async delete(id: string, organizationUnitId: string): Promise<EventEntity> {
    const [event] = await this.db
      .update(schema.events)
      .set({ isDeleted: true })
      .where(
        and(
          eq(schema.events.id, id),
          eq(schema.events.organizationUnitId, organizationUnitId),
          eq(schema.events.isDeleted, false),
        ),
      )
      .returning();

    if (!event) {
      throw new NotFoundGraphQLError(`Event with ID ${id} not found`);
    }

    void this.loadAndEmitEventCancelledNotification(event);

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
      .select({
        userId: schema.eventInvites.userId,
        status: schema.eventInvites.status,
      })
      .from(schema.eventInvites)
      .where(
        and(
          eq(schema.eventInvites.eventId, eventId),
          inArray(schema.eventInvites.userId, memberIds),
        ),
      );

    const existingByUserId = new Map(
      existing.map((row) => [row.userId, row.status]),
    );
    const newMemberIds = memberIds.filter((id) => !existingByUserId.has(id));
    const reinviteMemberIds = memberIds.filter((id) =>
      isAdminEndedInvite(existingByUserId.get(id)),
    );

    if (newMemberIds.length === 0 && reinviteMemberIds.length === 0) {
      return event;
    }

    if (newMemberIds.length > 0) {
      await this.db
        .insert(schema.eventInvites)
        .values(
          newMemberIds.map((userId) => ({
            eventId,
            userId,
            origin: EventInviteOrigin.ADMIN_INVITED,
            status: null,
          })),
        )
        .onConflictDoNothing();
    }

    if (reinviteMemberIds.length > 0) {
      const restored = reinviteTarget();
      await this.db
        .update(schema.eventInvites)
        .set({ origin: restored.origin, status: restored.status })
        .where(
          and(
            eq(schema.eventInvites.eventId, eventId),
            inArray(schema.eventInvites.userId, reinviteMemberIds),
          ),
        );
    }

    void this.loadAndEmitEventInvitedNotification(event, [
      ...newMemberIds,
      ...reinviteMemberIds,
    ]);

    return event;
  }

  private async getEventRequiredFormStatuses(
    userId: string,
    eventId: string,
  ): Promise<RequiredFormStatus[]> {
    return this.requiredFormService.getRequiredFormStatuses(userId, {
      targetType: RequiredFormTargetType.EVENT,
      targetId: eventId,
    });
  }

  private async checkEventRequiredForms(
    userId: string,
    eventId: string,
  ): Promise<{
    satisfied: boolean;
    requiredForms: RequiredFormStatus[];
  }> {
    const requiredForms = await this.getEventRequiredFormStatuses(
      userId,
      eventId,
    );
    const missingForms = requiredForms.filter((s) => !s.submitted);
    return { satisfied: missingForms.length === 0, requiredForms };
  }

  async joinEvent(
    userId: string,
    eventId: string,
    tx?: Database,
    formsAlreadySatisfied?: boolean,
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

    if (!formsAlreadySatisfied) {
      const requiredFormStatuses = await this.getEventRequiredFormStatuses(
        userId,
        eventId,
      );
      const missingForms = requiredFormStatuses.filter((s) => !s.submitted);
      if (missingForms.length > 0) {
        throw new ConflictGraphQLError(
          'You must complete the required forms before joining this event.',
        );
      }
    }

    const existingInvite = await db.query.eventInvites.findFirst({
      where: { eventId, userId },
    });

    if (existingInvite) {
      if (isParticipatingInvite(existingInvite.origin, existingInvite.status)) {
        return event;
      }

      const joinOrigin = EventInviteOrigin.VOLUNTEER_JOINED;
      if (
        !canTransitionInvite(
          existingInvite.origin,
          existingInvite.status,
          joinOrigin,
          null,
        )
      ) {
        throw new BadRequestGraphQLError(
          `Cannot transition invite from ${existingInvite.origin ?? 'null'}/${existingInvite.status ?? 'null'} to ${joinOrigin}/null`,
        );
      }

      await db
        .update(schema.eventInvites)
        .set({ origin: joinOrigin, status: null })
        .where(eq(schema.eventInvites.id, existingInvite.id));

      void this.loadAndEmitEventJoinedNotification(userId, event);

      return event;
    }

    await db
      .insert(schema.eventInvites)
      .values({
        eventId,
        userId,
        origin: EventInviteOrigin.VOLUNTEER_JOINED,
        status: null,
      })
      .onConflictDoNothing();

    void this.loadAndEmitEventJoinedNotification(userId, event);

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
    requiredForms?: RequiredFormStatus[];
  }> {
    const event = await this.findByIdPublic(eventId);

    if (!event) {
      throw new NotFoundGraphQLError('Event not found');
    }

    const existingInvite = await this.findInvite(eventId, userId);
    if (existingInvite?.status === EventInviteStatus.ADMIN_REJECTED) {
      return {
        status: JoinStatus.REJECTED,
        event,
      };
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

      if (result.status === 'REJECTED') {
        return {
          status: JoinStatus.REJECTED,
          event,
          membershipRequest: result.membershipRequest,
        };
      }

      const eventFormsCheck = await this.checkEventRequiredForms(
        userId,
        eventId,
      );
      if (!eventFormsCheck.satisfied) {
        return {
          status: JoinStatus.REQUIREMENTS_NEEDED,
          event,
          requiredForms: eventFormsCheck.requiredForms,
        };
      }

      if (result.status === 'JOINED') {
        await this.joinEvent(userId, eventId, undefined, true);
        return {
          status: JoinStatus.JOINED,
          event,
        };
      }

      return {
        status: JoinStatus.PENDING,
        event,
        membershipRequest: result.membershipRequest,
      };
    }

    const eventFormsCheck = await this.checkEventRequiredForms(userId, eventId);
    if (!eventFormsCheck.satisfied) {
      return {
        status: JoinStatus.REQUIREMENTS_NEEDED,
        event,
        requiredForms: eventFormsCheck.requiredForms,
      };
    }

    await this.joinEvent(userId, eventId, undefined, true);
    return {
      status: JoinStatus.JOINED,
      event,
    };
  }

  async updateEventInviteStatus(
    userId: string,
    eventId: string,
    status: EventInviteStatus | null,
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

    const nextOrigin =
      status == null ? EventInviteOrigin.ADMIN_INVITED : invite.origin;
    const nextStatus = status;

    if (
      !canTransitionInvite(invite.origin, invite.status, nextOrigin, nextStatus)
    ) {
      throw new BadRequestGraphQLError(
        `Cannot transition invite from ${invite.origin ?? 'null'}/${invite.status ?? 'null'} to ${nextOrigin ?? 'null'}/${nextStatus ?? 'null'}`,
      );
    }

    if (invite.origin === nextOrigin && invite.status === nextStatus) {
      return invite;
    }

    const updated = await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(schema.eventInvites)
        .set({ origin: nextOrigin, status: nextStatus })
        .where(eq(schema.eventInvites.id, invite.id))
        .returning();

      if (isAdminEndedInvite(status)) {
        await this.shiftService.adminRejectInvitesForEventUser(
          eventId,
          userId,
          tx,
        );
      } else if (status == null) {
        await this.shiftService.adminReinviteInvitesForEventUser(
          eventId,
          userId,
          tx,
        );
      }

      return updated;
    });

    if (status == null) {
      void this.loadAndEmitEventInvitedNotification(event, [userId]);
    }

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

  async findInvitesByEventIdsForUser(
    userId: string,
    eventIds: string[],
  ): Promise<EventInviteEntity[]> {
    if (eventIds.length === 0) {
      return [];
    }

    return this.db.query.eventInvites.findMany({
      where: {
        userId,
        eventId: { in: eventIds },
      },
    });
  }

  async findInvites(
    eventId: string,
    organizationUnitId: string,
  ): Promise<EventInviteEntity[]> {
    await this.findById(eventId, organizationUnitId);

    return this.db.query.eventInvites.findMany({
      where: {
        eventId,
        ...ADMIN_LIST_INVITE_WHERE,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countInvitesByEventIds(
    eventIds: string[],
  ): Promise<Array<{ eventId: string; count: number }>> {
    if (eventIds.length === 0) {
      return [];
    }

    const rows = await this.db
      .select({
        eventId: schema.eventInvites.eventId,
        count: count(),
      })
      .from(schema.eventInvites)
      .where(
        and(
          inArray(schema.eventInvites.eventId, eventIds),
          activeInviteSql(
            schema.eventInvites.origin,
            schema.eventInvites.status,
          ),
        ),
      )
      .groupBy(schema.eventInvites.eventId);

    return rows.map((row) => ({
      eventId: row.eventId,
      count: Number(row.count),
    }));
  }

  private async setRequiredFormsInTx(
    tx: Database,
    eventId: string,
    organizationUnitId: string,
    formIds: string[],
  ): Promise<void> {
    const orgUnit = await tx.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
    });

    if (!orgUnit) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    await this.requiredFormService.applyEventRequiredForms(
      eventId,
      orgUnit.organizationId,
      formIds,
      tx,
    );
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
    const {
      logoFileId,
      coverFileId,
      invitedMemberIds: _,
      requiredFormIds: __,
      ...rest
    } = input;

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

  private async loadAndEmitEventInvitedNotification(
    event: EventEntity,
    invitedUserIds: string[],
  ): Promise<void> {
    if (invitedUserIds.length === 0) {
      return;
    }

    try {
      const organizationUnit = await this.db.query.organizationUnits.findFirst({
        where: { id: event.organizationUnitId },
        columns: { id: true, name: true },
      });

      if (!organizationUnit) {
        return;
      }

      this.notificationService.notifyEventInvited({
        organizationUnitId: organizationUnit.id,
        organizationUnitName: organizationUnit.name,
        eventId: event.id,
        eventTitle: event.title,
        eventLocation: event.location,
        recipientUserIds: invitedUserIds,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit event invited notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async loadAndEmitEventJoinedNotification(
    userId: string,
    event: EventEntity,
  ): Promise<void> {
    try {
      const organizationUnit = await this.db.query.organizationUnits.findFirst({
        where: { id: event.organizationUnitId },
        columns: { id: true, name: true },
      });

      if (!organizationUnit) {
        return;
      }

      const eventManagers = await this.authService.findUsersWithPermission(
        event.organizationUnitId,
        PERMISSIONS.SHIFT_EDIT,
      );
      const recipientUserIds = eventManagers
        .filter((manager) => manager.id !== userId)
        .map((manager) => manager.id);

      if (recipientUserIds.length === 0) {
        return;
      }

      this.notificationService.notifyEventJoined({
        organizationUnitId: event.organizationUnitId,
        organizationUnitName: organizationUnit.name,
        eventTitle: event.title,
        joinedUserId: userId,
        recipientUserIds,
        startsAt: event.startsAt,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit event joined notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async loadAndEmitEventCancelledNotification(
    event: EventEntity,
  ): Promise<void> {
    try {
      const [organizationUnit, activeInvites] = await Promise.all([
        this.db.query.organizationUnits.findFirst({
          where: { id: event.organizationUnitId },
          columns: { id: true, name: true },
        }),
        this.db.query.eventInvites.findMany({
          where: {
            eventId: event.id,
            ...ACTIVE_INVITE_WHERE,
          },
          columns: { userId: true },
        }),
      ]);

      if (!organizationUnit) {
        return;
      }

      const recipientUserIds = activeInvites.map((invite) => invite.userId);
      if (recipientUserIds.length === 0) {
        return;
      }

      this.notificationService.notifyEventCancelled({
        organizationUnitId: organizationUnit.id,
        organizationUnitName: organizationUnit.name,
        eventTitle: event.title,
        eventLocation: event.location,
        recipientUserIds,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit event cancelled notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
