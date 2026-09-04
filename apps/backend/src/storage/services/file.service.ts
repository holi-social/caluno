import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AuthService } from '../../auth/auth.service';
import { PERMISSIONS } from '../../auth/constants';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../../shared/observability/posthog.events';
import { PostHogService } from '../../shared/observability/posthog.service';
import {
  isMimeTypeAllowed,
  PURPOSE_VALIDATION_RULES,
  sanitizeFilename,
} from '../constants/purpose-validation';
import { FilePurpose, FileStatus, FileVisibility } from '../enums';
import type { FileEntity } from '../schemas/file.schema';
import { S3StorageService } from './s3-storage.service';

export interface PresignUploadInput {
  purpose: FilePurpose;
  filename: string;
  mimeType: string;
  byteSize: number;
  organizationUnitId?: string | null;
}

export interface PresignUploadResult {
  fileId: string;
  uploadUrl: string;
  storageKey: string;
  headers: {
    'Content-Type': string;
    'Content-Length': string;
  };
}

@Injectable()
export class FileService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly s3StorageService: S3StorageService,
    private readonly authService: AuthService,
    private readonly postHogService: PostHogService,
  ) {}

  async presignUpload(
    userId: string,
    input: PresignUploadInput,
  ): Promise<PresignUploadResult> {
    const rule = PURPOSE_VALIDATION_RULES[input.purpose];
    if (!rule) {
      throw new BadRequestException('Unsupported file purpose');
    }

    if (rule.requiresOrganizationUnitId && !input.organizationUnitId) {
      throw new BadRequestException(
        'organizationUnitId is required for this file purpose',
      );
    }

    if (!isMimeTypeAllowed(rule, input.mimeType)) {
      throw new BadRequestException(
        'MIME type is not allowed for this purpose',
      );
    }

    if (input.byteSize <= 0 || input.byteSize > rule.maxByteSize) {
      throw new BadRequestException(
        'File size is not allowed for this purpose',
      );
    }

    if (!this.s3StorageService.isConfigured()) {
      throw new BadRequestException('Object storage is not configured');
    }

    if (input.organizationUnitId) {
      const hasPermission = await this.authService.hasRequiredPermissions(
        userId,
        input.organizationUnitId,
        [
          rule.requiredPermission as (typeof PERMISSIONS)[keyof typeof PERMISSIONS],
        ],
      );
      if (!hasPermission) {
        throw new ForbiddenException(
          'You do not have permission to upload this file type',
        );
      }
    }

    const sanitizedFilename = sanitizeFilename(input.filename);
    const storageKey = this.buildStorageKey({
      visibility: rule.visibility,
      organizationUnitId: input.organizationUnitId,
      userId,
      purpose: input.purpose,
      filename: sanitizedFilename,
    });

    const [file] = await this.db
      .insert(schema.files)
      .values({
        storageKey,
        bucket: this.s3StorageService.getBucket(),
        visibility:
          rule.visibility === 'public'
            ? FileVisibility.PUBLIC
            : FileVisibility.PRIVATE,
        purpose: input.purpose,
        mimeType: input.mimeType,
        filename: sanitizedFilename,
        byteSize: input.byteSize,
        status: FileStatus.PENDING,
        uploadedByUserId: userId,
        organizationUnitId: input.organizationUnitId ?? null,
      })
      .returning();

    this.postHogService.capture({
      event: POSTHOG_EVENT.FILE_CREATE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_unit_id: file.organizationUnitId ?? undefined,
        purpose: file.purpose,
      },
    });

    const uploadUrl = await this.s3StorageService.createPresignedUploadUrl({
      storageKey,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
    });

    return {
      fileId: file.id,
      uploadUrl,
      storageKey,
      headers: {
        'Content-Type': input.mimeType,
        'Content-Length': String(input.byteSize),
      },
    };
  }

  /**
   * Stores bytes generated server-side (e.g. rendered document PDFs): writes
   * the object directly and records an UPLOADED file row in one step — the
   * presigned path is for client uploads only.
   */
  async saveGeneratedFile(args: {
    organizationUnitId: string;
    filename: string;
    mimeType: string;
    bytes: Buffer;
    uploadedByUserId: string;
    purpose: FilePurpose;
  }): Promise<FileEntity> {
    const rule = PURPOSE_VALIDATION_RULES[args.purpose];
    if (!rule) {
      throw new BadRequestException('Unsupported file purpose');
    }
    if (!isMimeTypeAllowed(rule, args.mimeType)) {
      throw new BadRequestException(
        'MIME type is not allowed for this purpose',
      );
    }

    if (args.bytes.length <= 0 || args.bytes.length > rule.maxByteSize) {
      throw new BadRequestException(
        'File size is not allowed for this purpose',
      );
    }

    const sanitizedFilename = sanitizeFilename(args.filename);
    const storageKey = this.buildStorageKey({
      visibility: rule.visibility,
      organizationUnitId: args.organizationUnitId,
      userId: args.uploadedByUserId,
      purpose: args.purpose,
      filename: sanitizedFilename,
    });

    await this.s3StorageService.putObject(
      storageKey,
      args.bytes,
      args.mimeType,
    );

    const [file] = await this.db
      .insert(schema.files)
      .values({
        storageKey,
        bucket: this.s3StorageService.getBucket(),
        visibility:
          rule.visibility === 'public'
            ? FileVisibility.PUBLIC
            : FileVisibility.PRIVATE,
        purpose: args.purpose,
        mimeType: args.mimeType,
        filename: sanitizedFilename,
        byteSize: args.bytes.length,
        status: FileStatus.UPLOADED,
        uploadedByUserId: args.uploadedByUserId,
        organizationUnitId: args.organizationUnitId,
        uploadedAt: new Date(),
      })
      .returning();
    if (!file) {
      throw new Error('Failed to save generated file');
    }
    return file;
  }

  async completeUpload(userId: string, fileId: string): Promise<FileEntity> {
    const file = await this.findByIdOrThrow(fileId);

    if (file.uploadedByUserId !== userId) {
      throw new ForbiddenException('You can only complete your own uploads');
    }

    if (file.status === FileStatus.UPLOADED) {
      return file;
    }

    const rule = PURPOSE_VALIDATION_RULES[file.purpose];
    const object = await this.s3StorageService.headObject(file.storageKey);

    if (object.contentLength <= 0 || object.contentLength > rule.maxByteSize) {
      await this.markFailed(file.id);
      throw new BadRequestException('Uploaded object size is invalid');
    }

    if (object.contentType && !isMimeTypeAllowed(rule, object.contentType)) {
      await this.markFailed(file.id);
      throw new BadRequestException('Uploaded object MIME type is invalid');
    }

    const publicUrl =
      file.visibility === FileVisibility.PUBLIC
        ? this.s3StorageService.buildPublicUrl(file.storageKey)
        : null;

    const [updated] = await this.db
      .update(schema.files)
      .set({
        status: FileStatus.UPLOADED,
        byteSize: object.contentLength,
        mimeType: object.contentType ?? file.mimeType,
        publicUrl,
        uploadedAt: new Date(),
      })
      .where(eq(schema.files.id, file.id))
      .returning();

    this.postHogService.capture({
      event: POSTHOG_EVENT.FILE_UPLOAD,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_unit_id: updated.organizationUnitId ?? undefined,
        purpose: updated.purpose,
      },
    });

    return updated;
  }

  async presignDownload(
    userId: string,
    fileId: string,
    organizationUnitId?: string | null,
  ): Promise<{ downloadUrl: string }> {
    const file = await this.findByIdOrThrow(fileId);

    if (file.visibility === FileVisibility.PUBLIC && file.publicUrl) {
      return { downloadUrl: file.publicUrl };
    }

    const canDownload = await this.canDownloadPrivateFile(
      userId,
      file,
      organizationUnitId,
    );
    if (!canDownload) {
      throw new ForbiddenException(
        'You do not have permission to download this file',
      );
    }

    if (file.status !== FileStatus.UPLOADED) {
      throw new BadRequestException('File upload is not complete');
    }

    const downloadUrl = await this.s3StorageService.createPresignedDownloadUrl(
      file.storageKey,
    );

    return { downloadUrl };
  }

  async resolvePublicUrlForUploadedFile(fileId: string): Promise<string> {
    const file = await this.findByIdOrThrow(fileId);

    if (file.status !== FileStatus.UPLOADED) {
      throw new BadRequestException('File upload is not complete');
    }

    if (file.visibility !== FileVisibility.PUBLIC) {
      throw new BadRequestException('File is not publicly accessible');
    }

    return (
      file.publicUrl ?? this.s3StorageService.buildPublicUrl(file.storageKey)
    );
  }

  async assertUploadedFileForPurpose(
    fileId: string,
    purpose: FilePurpose,
  ): Promise<FileEntity> {
    const file = await this.findByIdOrThrow(fileId);

    if (file.purpose !== purpose) {
      throw new BadRequestException('File purpose does not match');
    }

    if (file.status !== FileStatus.UPLOADED) {
      throw new BadRequestException('File upload is not complete');
    }

    return file;
  }

  async assertUploadedFileOwnedByUser(
    fileId: string,
    userId: string,
    purpose: FilePurpose,
  ): Promise<FileEntity> {
    const file = await this.findByIdOrThrow(fileId);

    if (file.uploadedByUserId !== userId) {
      throw new ForbiddenException('File does not belong to the current user');
    }

    if (file.purpose !== purpose) {
      throw new BadRequestException('File purpose does not match');
    }

    if (file.status !== FileStatus.UPLOADED) {
      throw new BadRequestException('File upload is not complete');
    }

    return file;
  }

  async findById(id: string): Promise<FileEntity | undefined> {
    return this.db.query.files.findFirst({ where: { id } });
  }

  private async findByIdOrThrow(id: string): Promise<FileEntity> {
    const file = await this.findById(id);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  private async canDownloadPrivateFile(
    userId: string,
    file: FileEntity,
    organizationUnitId?: string | null,
  ): Promise<boolean> {
    if (file.uploadedByUserId === userId) {
      return true;
    }

    const scopedOrganizationUnitId =
      organizationUnitId ?? file.organizationUnitId;
    if (!scopedOrganizationUnitId) {
      return false;
    }

    if (
      file.organizationUnitId &&
      file.organizationUnitId !== scopedOrganizationUnitId
    ) {
      return false;
    }

    return this.authService.hasRequiredPermissions(
      userId,
      scopedOrganizationUnitId,
      [PERMISSIONS.REQUIREMENT_PROFILE_VIEW],
    );
  }

  private buildStorageKey(input: {
    visibility: 'private' | 'public';
    organizationUnitId?: string | null;
    userId: string;
    purpose: FilePurpose;
    filename: string;
  }): string {
    const prefix = input.visibility;
    const orgSegment = input.organizationUnitId ?? 'global';
    const uniqueName = `${randomUUID()}-${input.filename}`;

    if (input.visibility === 'private') {
      return `${prefix}/${orgSegment}/${input.userId}/${uniqueName}`;
    }

    return `${prefix}/${orgSegment}/${input.purpose}/${uniqueName}`;
  }

  private async markFailed(fileId: string): Promise<void> {
    await this.db
      .update(schema.files)
      .set({ status: FileStatus.FAILED })
      .where(eq(schema.files.id, fileId));
  }
}
