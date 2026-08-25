import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { FileService } from '../../storage/services/file.service';
import { RequirementFulfillmentUpload } from '../models/requirement-fulfillment.model';

@Resolver(() => RequirementFulfillmentUpload)
export class RequirementFulfillmentUploadFieldResolver {
  constructor(private readonly fileService: FileService) {}

  @ResolveField(() => String, { nullable: true })
  async downloadUrl(
    @Parent() fulfillment: RequirementFulfillmentUpload,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<string | null> {
    const fileId = fulfillment.fileId;
    if (!fileId || !context.user) {
      return null;
    }

    try {
      const { downloadUrl } = await this.fileService.presignDownload(
        context.user.id,
        fileId,
        context.organizationUnitId,
      );
      return downloadUrl;
    } catch {
      return null;
    }
  }
}
