import {
  Body,
  Controller,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { FileService } from './services/file.service';

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('storage')
export class StorageController {
  constructor(private readonly fileService: FileService) {}

  @Post('uploads/presign')
  async presignUpload(
    @Session() session: UserSession,
    @Body() body: PresignUploadDto,
    @Headers('x-organization-unit-id') organizationUnitId?: string,
  ) {
    const resolvedOrganizationUnitId =
      body.organizationUnitId ?? organizationUnitId ?? null;

    return this.fileService.presignUpload(session.user.id, {
      ...body,
      organizationUnitId: resolvedOrganizationUnitId,
    });
  }

  @Post('uploads/:fileId/complete')
  async completeUpload(
    @Session() session: UserSession,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    const file = await this.fileService.completeUpload(session.user.id, fileId);

    return {
      id: file.id,
      purpose: file.purpose,
      mimeType: file.mimeType,
      filename: file.filename,
      byteSize: file.byteSize,
      visibility: file.visibility,
      publicUrl: file.publicUrl,
      status: file.status,
      uploadedAt: file.uploadedAt,
    };
  }

  @Post('objects/:fileId/presign-download')
  async presignDownload(
    @Session() session: UserSession,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Headers('x-organization-unit-id') organizationUnitId?: string,
  ) {
    return this.fileService.presignDownload(
      session.user.id,
      fileId,
      organizationUnitId,
    );
  }
}
