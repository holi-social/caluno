import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Loader } from '../../graphql/decorators';
import { NotFoundGraphQLError } from '../../graphql/errors';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { EventInvite } from '../models/event-invite.model';
import type { EventInviteEntity } from '../schemas/event-invite.schema';
import { EventInviteUsersLoader } from './event-invite-users.loader';

@Resolver(() => EventInvite)
export class EventInviteFieldResolver {
  constructor(private readonly userMapper: UserMapper) {}

  @ResolveField(() => User)
  async user(
    @Parent() invite: EventInviteEntity,
    @Loader(EventInviteUsersLoader)
    loader: EventInviteUsersLoader,
  ): Promise<User> {
    const user = await loader.byId.load(invite.userId);
    if (!user) {
      throw new NotFoundGraphQLError('User not found');
    }
    return this.userMapper.toModelOrThrow(user);
  }
}
