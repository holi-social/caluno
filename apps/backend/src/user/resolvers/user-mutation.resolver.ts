import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { BadRequestGraphQLError } from '../../graphql/errors';
import { SUPPORTED_LOCALES } from '../../graphql/locale';
import { UserMapper } from '../mappers/user.mapper';
import { User } from '../models/user.model';
import { UserService } from '../user.service';

@Resolver(() => User)
export class UserMutationResolver {
  constructor(
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
  ) {}

  @Mutation(() => User)
  async updateMyLocale(
    @Args('locale') locale: string,
    @Session() session: UserSession,
  ): Promise<User> {
    const normalized = locale.trim().toLowerCase();
    if (
      !SUPPORTED_LOCALES.includes(
        normalized as (typeof SUPPORTED_LOCALES)[number],
      )
    ) {
      throw new BadRequestGraphQLError(`Unsupported locale: ${normalized}`);
    }

    const user = await this.userService.updateLocale(
      session.user.id,
      normalized,
    );
    return this.userMapper.toModelOrThrow(user);
  }
}
