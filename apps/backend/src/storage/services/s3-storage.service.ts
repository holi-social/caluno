import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const PRESIGN_UPLOAD_TTL_SECONDS = 15 * 60;
const PRESIGN_DOWNLOAD_TTL_SECONDS = 15 * 60;

@Injectable()
export class S3StorageService {
  private readonly client: S3Client | null;
  private readonly bucket: string | null;
  private readonly publicBaseUrl: string | null;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('STORAGE_ENDPOINT');
    const region =
      this.configService.get<string>('STORAGE_REGION') ?? 'us-east-1';
    const accessKeyId = this.configService.get<string>('STORAGE_ACCESS_KEY');
    const secretAccessKey =
      this.configService.get<string>('STORAGE_SECRET_KEY');
    this.bucket = this.configService.get<string>('STORAGE_BUCKET') ?? null;
    this.publicBaseUrl =
      this.configService.get<string>('STORAGE_PUBLIC_BASE_URL') ?? null;

    if (endpoint && accessKeyId && secretAccessKey && this.bucket) {
      this.client = new S3Client({
        region,
        endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    } else {
      this.client = null;
    }
  }

  isConfigured(): boolean {
    return this.client !== null && this.bucket !== null;
  }

  getBucket(): string {
    if (!this.bucket) {
      throw new Error('STORAGE_BUCKET is not configured');
    }

    return this.bucket;
  }

  buildPublicUrl(storageKey: string): string {
    const bucket = this.getBucket();
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/+$/, '')}/${storageKey}`;
    }

    const endpoint =
      this.configService.get<string>('STORAGE_ENDPOINT')?.replace(/\/+$/, '') ??
      '';
    return `${endpoint}/${bucket}/${storageKey}`;
  }

  async createPresignedUploadUrl(input: {
    storageKey: string;
    mimeType: string;
    byteSize: number;
  }): Promise<string> {
    if (!this.client) {
      throw new Error('Object storage is not configured');
    }

    const command = new PutObjectCommand({
      Bucket: this.getBucket(),
      Key: input.storageKey,
      ContentType: input.mimeType,
      ContentLength: input.byteSize,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: PRESIGN_UPLOAD_TTL_SECONDS,
    });
  }

  async createPresignedDownloadUrl(storageKey: string): Promise<string> {
    if (!this.client) {
      throw new Error('Object storage is not configured');
    }

    const command = new GetObjectCommand({
      Bucket: this.getBucket(),
      Key: storageKey,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: PRESIGN_DOWNLOAD_TTL_SECONDS,
    });
  }

  async headObject(storageKey: string): Promise<{
    contentLength: number;
    contentType: string | undefined;
  }> {
    if (!this.client) {
      throw new Error('Object storage is not configured');
    }

    const response = await this.client.send(
      new HeadObjectCommand({
        Bucket: this.getBucket(),
        Key: storageKey,
      }),
    );

    return {
      contentLength: response.ContentLength ?? 0,
      contentType: response.ContentType,
    };
  }

  async deleteObject(storageKey: string): Promise<void> {
    if (!this.client) {
      throw new Error('Object storage is not configured');
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.getBucket(),
        Key: storageKey,
      }),
    );
  }
}
