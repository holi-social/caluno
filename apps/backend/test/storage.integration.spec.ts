import 'reflect-metadata';
import {
  beforeAll,
  describe,
  expect,
  it,
  mock,
  setDefaultTimeout,
} from 'bun:test';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as schema from '../src/database/schema';
import { FilePurpose, FileStatus, FileVisibility } from '../src/storage/enums';
import { applyBunAuthMocks } from './helpers/auth-mocks';
import { getGraphqlTestContext } from './helpers/graphql-test-context';

applyBunAuthMocks(mock.module);
setDefaultTimeout(20_000);

describe('Storage REST API Integration', () => {
  let app: INestApplication;
  let testUserId: string;
  let organizationUnitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    testUserId = context.testUserId;
    organizationUnitId = context.organizationUnitId;
  });

  it('presigns, uploads, and completes a public file when storage is configured', async () => {
    if (!process.env.STORAGE_ENDPOINT) {
      return;
    }

    const fileBytes = Buffer.from('test-image');
    const presignResponse = await request(app.getHttpServer())
      .post('/storage/uploads/presign')
      .set('x-organization-unit-id', organizationUnitId)
      .send({
        purpose: FilePurpose.ORG_LOGO,
        filename: 'logo.png',
        mimeType: 'image/png',
        byteSize: fileBytes.byteLength,
        organizationUnitId,
      });

    expect(presignResponse.status).toBe(201);
    const presignBody = presignResponse.body;

    const uploadResponse = await fetch(presignBody.uploadUrl, {
      method: 'PUT',
      headers: presignBody.headers,
      body: fileBytes,
    });
    expect(uploadResponse.ok).toBe(true);

    const completeResponse = await request(app.getHttpServer())
      .post(`/storage/uploads/${presignBody.fileId}/complete`)
      .set('x-organization-unit-id', organizationUnitId);

    expect(completeResponse.status).toBe(201);
    expect(completeResponse.body.status).toBe(FileStatus.UPLOADED);
    expect(completeResponse.body.publicUrl).toContain('public/');
  });

  it('rejects non-image MIME types for image upload purposes', async () => {
    const response = await request(app.getHttpServer())
      .post('/storage/uploads/presign')
      .set('x-organization-unit-id', organizationUnitId)
      .send({
        purpose: FilePurpose.ORG_LOGO,
        filename: 'notes.pdf',
        mimeType: 'application/pdf',
        byteSize: 100,
        organizationUnitId,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('MIME type is not allowed');
  });

  it('allows owners to presign private downloads for uploaded files', async () => {
    const context = await getGraphqlTestContext();
    const db = context.db;

    const [file] = await db
      .insert(schema.files)
      .values({
        storageKey: `private/${organizationUnitId}/${testUserId}/test.pdf`,
        bucket: process.env.STORAGE_BUCKET ?? 'clippy',
        visibility: FileVisibility.PRIVATE,
        purpose: FilePurpose.REQUIREMENT_DOCUMENT,
        mimeType: 'application/pdf',
        filename: 'test.pdf',
        byteSize: 10,
        status: FileStatus.UPLOADED,
        uploadedByUserId: testUserId,
        organizationUnitId,
        uploadedAt: new Date(),
      })
      .returning();

    const response = await request(app.getHttpServer())
      .post(`/storage/objects/${file.id}/presign-download`)
      .set('x-organization-unit-id', organizationUnitId);

    if (!process.env.STORAGE_ENDPOINT) {
      expect(response.status).toBe(500);
      return;
    }

    expect(response.status).toBe(201);
    expect(response.body.downloadUrl).toBeString();
  });
});
