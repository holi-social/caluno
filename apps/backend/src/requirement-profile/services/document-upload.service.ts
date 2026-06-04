import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import type { DocumentEntity } from '../schemas/document.schema';

@Injectable()
export class DocumentUploadService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async generateUploadUrl(
    filename: string,
    mimeType: string,
    userId: string,
  ): Promise<{ uploadUrl: string; storageKey: string }> {
    // For MVP, return a placeholder. In production, this should generate
    // a presigned URL for S3/Scaleway/Object Storage.
    const storageKey = `documents/${userId}/${randomUUID()}-${filename}`;

    // Check if we have storage config
    const storageEndpoint = process.env.STORAGE_ENDPOINT;
    const storageBucket = process.env.STORAGE_BUCKET;

    if (!storageEndpoint || !storageBucket) {
      // Fallback: direct upload via a future REST endpoint
      return {
        uploadUrl: `/api/upload?key=${encodeURIComponent(storageKey)}`,
        storageKey,
      };
    }

    // TODO: Implement presigned URL generation with aws-sdk or similar
    const uploadUrl = `${storageEndpoint}/${storageBucket}/${storageKey}`;
    return { uploadUrl, storageKey };
  }

  async createDocument(
    storageKey: string,
    mimeType: string,
    userId: string,
  ): Promise<DocumentEntity> {
    const [document] = await this.db
      .insert(schema.documents)
      .values({
        userId,
        storageKey,
        mimeType,
        uploadedAt: new Date(),
      })
      .returning();

    return document;
  }
}
