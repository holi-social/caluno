import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { BadRequestGraphQLError } from '../../graphql/errors';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { SYSTEM_PROFILE_KEYS } from '../constants';
import { UpdateUserProfileInput } from '../inputs/update-user-profile.input';
import { UserProfileMapper } from '../mappers/user-profile.mapper';
import { UserProfile } from '../models/user-profile.model';
import {
  formatSystemKeyLabel,
  validateSystemKeyValue,
} from '../profile-validation';
import { UserProfileService } from '../services';

@Resolver(() => UserProfile)
export class UserProfileMutationResolver {
  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly userProfileMapper: UserProfileMapper,
  ) {}

  @Mutation(() => UserProfile)
  async updateMyUserProfile(
    @Args('input') input: UpdateUserProfileInput,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<UserProfile> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input.data);
    } catch {
      throw new BadRequestGraphQLError('Invalid JSON in data field');
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new BadRequestGraphQLError('data must be a JSON object');
    }

    const data = Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(([key]) =>
        SYSTEM_PROFILE_KEYS.has(key),
      ),
    );

    // Validate the incoming profile fields (same rules as the form-submission
    // path), so an invalid IBAN/BIC is rejected here too, not only client-side.
    for (const [key, value] of Object.entries(data)) {
      if (typeof value !== 'string') continue;
      validateSystemKeyValue(value, key, formatSystemKeyLabel(key), null);
    }

    const item = await this.userProfileService.upsertData(
      session.user.id,
      data,
    );
    return this.userProfileMapper.toModelOrThrow(item);
  }
}
