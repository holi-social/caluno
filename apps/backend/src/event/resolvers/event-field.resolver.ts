import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { EventService } from '../event.service';
import { Event } from '../models/event.model';
import type { EventEntity } from '../schemas/event.schema';

@Resolver(() => Event)
export class EventFieldResolver {
  constructor(
    private readonly eventService: EventService,
    private readonly userMapper: UserMapper,
  ) {}

  @ResolveField(() => User, { nullable: true })
  async organizer(
    @Parent() event: EventEntity,
    @Session() session: UserSession,
  ): Promise<User | null> {
    if (!session?.user) {
      return null;
    }

    const organizer = await this.eventService.findOrganizer(event.createdById);
    return this.userMapper.toModelOrThrow(organizer);
  }
}
