import { Context, Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { UserProfileMapper } from '../mappers/user-profile.mapper';
import { UserProfile } from '../models/user-profile.model';
import { UserProfileService } from '../services';

@Resolver(() => UserProfile)
export class UserProfileQueryResolver {
  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly userProfileMapper: UserProfileMapper,
  ) {}

  @Query(() => UserProfile, { nullable: true })
  async myUserProfile(
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<UserProfile | null> {
    const item = await this.userProfileService.findByUserId(session.user.id);
    return this.userProfileMapper.toModel(item);
  }
}
