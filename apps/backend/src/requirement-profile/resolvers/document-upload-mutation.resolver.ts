import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { DocumentUploadService } from '../services';

@Resolver()
export class DocumentUploadMutationResolver {
  constructor(private readonly documentUploadService: DocumentUploadService) {}

  @Mutation(() => String)
  async generateDocumentUploadUrl(
    @Args('filename') filename: string,
    @Args('mimeType') mimeType: string,
    @Context() context: AuthenticatedGraphQLContext,
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
