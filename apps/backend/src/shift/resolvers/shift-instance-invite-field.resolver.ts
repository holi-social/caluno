import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Loader } from '../../graphql/decorators';
import { NotFoundGraphQLError } from '../../graphql/errors';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { ShiftInstanceInvite } from '../models/shift-instance-invite.model';
import type { ShiftInstanceInviteEntity } from '../schemas/shift-instance-invite.schema';
import { ShiftInstanceInviteUsersLoader } from './shift-instance-invite-users.loader';

@Resolver(() => ShiftInstanceInvite)
export class ShiftInstanceInviteFieldResolver {
  constructor(private readonly userMapper: UserMapper) {}

  @ResolveField(() => User)
  async user(
    @Parent() invite: ShiftInstanceInviteEntity,
    @Loader(ShiftInstanceInviteUsersLoader)
    loader: ShiftInstanceInviteUsersLoader,
  ): Promise<User> {
    const user = await loader.byId.load(invite.userId);
    if (!user) {
      throw new NotFoundGraphQLError('User not found');
    }
    return this.userMapper.toModelOrThrow(user);
  }
}
