import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { BadRequestGraphQLError } from '../../graphql/errors';
import { SUPPORTED_LOCALES } from '../../graphql/locale';
import { FilePurpose } from '../../storage/enums';
import { FileService } from '../../storage/services/file.service';
import { UpdateMyImageInput } from '../inputs/update-my-image.input';
import { UserMapper } from '../mappers/user.mapper';
import { User } from '../models/user.model';
import { UserService } from '../user.service';

@Resolver(() => User)
export class UserMutationResolver {
  constructor(
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
    private readonly fileService: FileService,
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

  @Mutation(() => User)
  async updateMyImage(
    @Args('input') input: UpdateMyImageInput,
    @Session() session: UserSession,
  ): Promise<User> {
    const imageUrl =
      input.imageFileId === undefined
        ? undefined
        : input.imageFileId
          ? await this.resolveProfileImageUrl(
              input.imageFileId,
              session.user.id,
            )
          : null;

    if (imageUrl === undefined) {
      throw new BadRequestGraphQLError('imageFileId is required');
    }

    const user = await this.userService.updateImage(session.user.id, imageUrl);
    return this.userMapper.toModelOrThrow(user);
  }

  private async resolveProfileImageUrl(
    fileId: string,
    userId: string,
  ): Promise<string> {
    await this.fileService.assertUploadedFileOwnedByUser(
      fileId,
      userId,
      FilePurpose.PROFILE_PICTURE,
    );
    return this.fileService.resolvePublicUrlForUploadedFile(fileId);
  }
}
