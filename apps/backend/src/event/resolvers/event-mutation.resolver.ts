import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { plainToInstance } from 'class-transformer';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { RequirementForm } from '../../requirement-profile/models/requirement-form.model';
import { RequirementProfile } from '../../requirement-profile/models/requirement-profile.model';
import { UserRequirementStatus } from '../../requirement-profile/models/user-requirement-status.model';
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
  ) {}

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
  ): Promise<Event> {
    const event = await this.eventService.update(
      id,
      context.organizationUnitId,
      input,
    );
    return this.eventMapper.toModelOrThrow(event);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => Event)
  async deleteEvent(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Event> {
    const event = await this.eventService.delete(
      id,
      context.organizationUnitId,
    );
    return this.eventMapper.toModelOrThrow(event);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => Event)
  async inviteMembersToEvent(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('memberIds', { type: () => [String] }) memberIds: string[],
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Event> {
    const event = await this.eventService.inviteMembersToEvent(
      eventId,
      memberIds,
      context.organizationUnitId,
    );
    return this.eventMapper.toModelOrThrow(event);
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
        })) ?? null,
    };
  }

  @Mutation(() => EventInvite)
  async updateEventInviteStatus(
    @Session() session: UserSession,
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('status', { type: () => EventInviteStatus })
    status: EventInviteStatus,
  ): Promise<EventInvite> {
    const invite = await this.eventService.updateEventInviteStatus(
      session.user.id,
      eventId,
      status,
    );
    return this.eventInviteMapper.toModelOrThrow(invite);
  }
}
