import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { EventService } from '../../event/event.service';
import { EventMapper } from '../../event/mappers/event.mapper';
import { Event } from '../../event/models/event.model';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { Shift } from '../models/shift.model';
import type { ShiftEntity } from '../schemas/shift.schema';
import { ShiftService } from '../shift.service';

@Resolver(() => Shift)
export class ShiftFieldResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly eventService: EventService,
    private readonly userMapper: UserMapper,
    private readonly eventMapper: EventMapper,
  ) {}

  @AllowAnonymous()
  @ResolveField(() => User, { nullable: true })
  async createdBy(
    @Parent() shift: ShiftEntity,
    @Session() session: UserSession,
  ): Promise<User | null> {
    if (!session?.user) {
      return null;
    }

    const creator = await this.shiftService.findCreator(shift.createdById);
    return this.userMapper.toModelOrThrow(creator);
  }

  @AllowAnonymous()
  @ResolveField(() => Event, { nullable: true })
  async event(@Parent() shift: ShiftEntity): Promise<Event | null> {
    if (!shift.eventId) {
      return null;
    }

    const event = await this.eventService.findByIdPublic(shift.eventId);
    return event ? this.eventMapper.toModelOrThrow(event) : null;
  }
}
