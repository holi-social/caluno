import { Args, Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { UserMapper } from './mappers/user.mapper';
import { User } from './models/user.model';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
  ) {}

  @Query(() => User)
  async me(@Session() session: UserSession): Promise<User> {
    const me = await this.userService.findByIdOrThrow(session.user.id);
    return this.userMapper.toModelOrThrow(me);
  }

  @Query(() => User, { nullable: true })
  async user(@Args('id') id: string): Promise<User | null> {
    const user = await this.userService.findById(id);
    return this.userMapper.toModel(user);
  }
}
