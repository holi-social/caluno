import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { plainToInstance } from 'class-transformer';
import { AuthService } from '../../auth/auth.service';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ForbiddenGraphQLError } from '../../graphql/errors';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { RequiredFormRef } from '../../organization/models/organization-unit-required-form.model';
import { RequiredFormTargetType } from '../../requirement-profile/enums';
import { RequiredFormRefMapper } from '../../requirement-profile/mappers/required-form-ref.mapper';
import { RequirementForm } from '../../requirement-profile/models/requirement-form.model';
import { RequirementProfile } from '../../requirement-profile/models/requirement-profile.model';
import { UserRequirementStatus } from '../../requirement-profile/models/user-requirement-status.model';
import { RequiredFormService } from '../../requirement-profile/services/required-form.service';
import { EventInviteStatus } from '../enums';
import { EventService } from '../event.service';
import { CreateEventInput } from '../inputs/create-event.input';
import { UpdateEventInput } from '../inputs/update-event.input';
import { EventMapper } from '../mappers/event.mapper';
import { EventInviteMapper } from '../mappers/event-invite.mapper';
import { Event } from '../models/event.model';
import { EventInvite } from '../models/event-invite.model';
import { JoinEventResult } from '../models/join-event-result.model';

@Resolver(() => Event)
export class EventMutationResolver {
  constructor(
    private readonly eventService: EventService,
    private readonly eventMapper: EventMapper,
    private readonly eventInviteMapper: EventInviteMapper,
    private readonly requiredFormService: RequiredFormService,
    private readonly requiredFormRefMapper: RequiredFormRefMapper,
    private readonly authService: AuthService,
  ) {}

  private async assertCanManageInviteForUser(
    actorUserId: string,
    targetUserId: string,
    eventId: string,
    organizationUnitId: string,
    status: EventInviteStatus,
  ): Promise<void> {
    const isSelf = actorUserId === targetUserId;
    const isAdminOnlyTarget =
      status === EventInviteStatus.ADMIN_REJECTED ||
      status === EventInviteStatus.ADMIN_INVITED;

    if (isSelf && !isAdminOnlyTarget) {
      return;
    }

    const hasPermission = await this.authService.hasRequiredPermissions(
      actorUserId,
      organizationUnitId,
      [PERMISSIONS.SHIFT_EDIT],
    );

    if (!hasPermission) {
      throw new ForbiddenGraphQLError(
        'You do not have permission to manage invites for other users',
      );
    }

    await this.eventService.findById(eventId, organizationUnitId);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => Event)
  async createEvent(
    @Session() session: UserSession,
    @Args('input') input: CreateEventInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Event> {
    const event = await this.eventService.create(
      session.user.id,
      context.organizationUnitId,
      input,
    );
    return this.eventMapper.toModelOrThrow(event);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => Event)
  async updateEvent(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateEventInput,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<Event> {
    const event = await this.eventService.update(
      id,
      context.organizationUnitId,
      input,
      session.user.id,
    );
    return this.eventMapper.toModelOrThrow(event);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => Event)
  async deleteEvent(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<Event> {
    const event = await this.eventService.delete(
      id,
      context.organizationUnitId,
      session.user.id,
    );
    return this.eventMapper.toModelOrThrow(event);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => Event)
  async inviteMembersToEvent(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('memberIds', { type: () => [String] }) memberIds: string[],
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<Event> {
    const event = await this.eventService.inviteMembersToEvent(
      eventId,
      memberIds,
      context.organizationUnitId,
      session.user.id,
    );
    return this.eventMapper.toModelOrThrow(event);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => [RequiredFormRef])
  async setEventRequiredForms(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('formIds', { type: () => [String] }) formIds: string[],
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<RequiredFormRef[]> {
    await this.eventService.findById(eventId, context.organizationUnitId);

    const requiredForms = await this.requiredFormService.setRequiredForms(
      { targetType: RequiredFormTargetType.EVENT, targetId: eventId },
      formIds,
      session.user.id,
    );

    return this.requiredFormRefMapper.toArray(requiredForms);
  }

  @Mutation(() => JoinEventResult)
  async joinEvent(
    @Session() session: UserSession,
    @Args('eventId', { type: () => ID }) eventId: string,
  ): Promise<JoinEventResult> {
    const result = await this.eventService.requestJoinEvent(
      session.user.id,
      eventId,
    );

    return {
      status: result.status,
      event: this.eventMapper.toModelOrThrow(result.event),
      membershipRequestId: result.membershipRequest?.id ?? null,
      requirementProfile: result.requirementProfile
        ? plainToInstance(RequirementProfile, result.requirementProfile)
        : null,
      requirementStatuses:
        result.requirementStatuses?.map((s) =>
          plainToInstance(UserRequirementStatus, s),
        ) ?? null,
      requiredForms:
        result.requiredForms?.map((s) => ({
          form: plainToInstance(RequirementForm, s.form),
          order: s.order,
          submitted: s.submitted,
          submissionId: s.submissionId,
          targetType: s.targetType,
          targetId: s.targetId,
        })) ?? null,
    };
  }

  @Mutation(() => EventInvite)
  async updateEventInviteStatus(
    @Session() session: UserSession,
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('status', { type: () => EventInviteStatus })
    status: EventInviteStatus,
    @Args('userId', { type: () => String, nullable: true })
    userId: string | null | undefined,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<EventInvite> {
    const targetUserId = userId ?? session.user.id;

    await this.assertCanManageInviteForUser(
      session.user.id,
      targetUserId,
      eventId,
      context.organizationUnitId,
      status,
    );

    const invite = await this.eventService.updateEventInviteStatus(
      targetUserId,
      eventId,
      status,
      session.user.id,
    );
    return this.eventInviteMapper.toModelOrThrow(invite);
  }
}
