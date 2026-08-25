import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { FileService } from '../../storage/services/file.service';
import { FormBlockField } from '../models/form-block-field.model';

@Resolver(() => FormBlockField)
export class FormBlockFieldDocumentResolver {
  constructor(private readonly fileService: FileService) {}

  @AllowAnonymous()
  @ResolveField(() => String, { nullable: true })
  async documentDownloadUrl(
    @Parent() field: FormBlockField,
  ): Promise<string | null> {
    if (!field.documentFileId) {
      return null;
    }

    try {
      return await this.fileService.resolvePublicUrlForUploadedFile(
        field.documentFileId,
      );
    } catch {
      return null;
    }
  }

  @AllowAnonymous()
  @ResolveField(() => String, { nullable: true })
  async documentFilename(
    @Parent() field: FormBlockField,
  ): Promise<string | null> {
    if (!field.documentFileId) {
      return null;
    }

    const file = await this.fileService.findById(field.documentFileId);
    return file?.filename ?? null;
  }
}
