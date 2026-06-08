import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { plainToInstance } from 'class-transformer';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { RequirementProfile } from '../../requirement-profile/models/requirement-profile.model';
import { UserRequirementStatus } from '../../requirement-profile/models/user-requirement-status.model';
import { EventService } from '../event.service';
import { CreateEventInput } from '../inputs/create-event.input';
import { UpdateEventInput } from '../inputs/update-event.input';
import { EventMapper } from '../mappers/event.mapper';
import { Event } from '../models/event.model';
import { JoinEventResult } from '../models/join-event-result.model';

@Resolver(() => Event)
export class EventMutationResolver {
  constructor(
    private readonly eventService: EventService,
    private readonly eventMapper: EventMapper,
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
    };
  }
}
