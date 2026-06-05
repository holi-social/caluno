import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { UserService } from '../../user/user.service';
import { Event } from '../models/event.model';
import type { EventEntity } from '../schemas/event.schema';

@Resolver(() => Event)
export class EventFieldResolver {
  constructor(
    private readonly userService: UserService,
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

    const organizer = await this.userService.findByIdOrThrow(event.createdById);
    return this.userMapper.toModelOrThrow(organizer);
  }
}
