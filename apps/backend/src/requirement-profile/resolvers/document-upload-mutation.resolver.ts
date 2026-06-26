import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { DocumentUploadService } from '../services';

@Resolver()
export class DocumentUploadMutationResolver {
  constructor(private readonly documentUploadService: DocumentUploadService) {}

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => String)
  async generateDocumentUploadUrl(
    @Args('filename') filename: string,
    @Args('mimeType') mimeType: string,
    @Session() session: UserSession,
  ): Promise<string> {
    const result = await this.documentUploadService.generateUploadUrl(
      filename,
      mimeType,
      session.user.id,
    );
    return result.uploadUrl;
  }
}
