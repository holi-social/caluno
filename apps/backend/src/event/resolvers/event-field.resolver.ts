import { Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { Loader } from '../../graphql/decorators/loader.decorator';
import { Shift } from '../../shift/models/shift.model';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { UserService } from '../../user/user.service';
import { Event } from '../models/event.model';
import type { EventEntity } from '../schemas/event.schema';
import { EventShiftsLoader } from './loader';

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

  @ResolveField(() => Int)
  async shiftsCount(
    @Parent() event: EventEntity,
    @Loader(EventShiftsLoader) loader: EventShiftsLoader,
  ): Promise<number> {
    return loader.countByEventId.load(event.id);
  }

  @ResolveField(() => [Shift])
  async shifts(
    @Parent() event: EventEntity,
    @Loader(EventShiftsLoader) loader: EventShiftsLoader,
  ): Promise<Shift[]> {
    return loader.shiftsByEventId.load(event.id);
  }

  @ResolveField(() => String, { nullable: true })
  coverImageUrl(@Parent() event: EventEntity): string | null {
    return event.coverUrl ?? null;
  }
}
