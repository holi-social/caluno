import { API_URL } from '@/lib/constants';

export type UploadPurpose =
  | 'requirement_document'
  | 'form_document'
  | 'org_logo'
  | 'organization_logo'
  | 'event_image'
  | 'shift_image'
  | 'profile_picture';

export interface UploadFileInput {
  purpose: UploadPurpose;
  file: File;
  organizationUnitId?: string;
}

export interface UploadFileResult {
  fileId: string;
  publicUrl: string | null;
  filename: string;
  mimeType: string;
}

interface PresignUploadResponse {
  fileId: string;
  uploadUrl: string;
  storageKey: string;
  headers: {
    'Content-Type': string;
    'Content-Length': string;
  };
}

interface CompleteUploadResponse {
  id: string;
  publicUrl: string | null;
  filename: string;
  mimeType: string;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) {
      return body.message.join(', ');
    }
    if (body.message) {
      return body.message;
    }
  } catch {
    // ignore parse errors
  }

  return `Upload request failed (${response.status})`;
}

export async function uploadFile({
  purpose,
  file,
  organizationUnitId,
}: UploadFileInput): Promise<UploadFileResult> {
  const presignResponse = await fetch(`${API_URL}/storage/uploads/presign`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(organizationUnitId
        ? { 'x-organization-unit-id': organizationUnitId }
        : {}),
    },
    body: JSON.stringify({
      purpose,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      byteSize: file.size,
      ...(organizationUnitId ? { organizationUnitId } : {}),
    }),
  });

  if (!presignResponse.ok) {
    throw new Error(await readErrorMessage(presignResponse));
  }

  const presign = (await presignResponse.json()) as PresignUploadResponse;

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: presign.headers,
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`File upload failed (${uploadResponse.status})`);
  }

  const completeResponse = await fetch(
    `${API_URL}/storage/uploads/${presign.fileId}/complete`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(organizationUnitId
          ? { 'x-organization-unit-id': organizationUnitId }
          : {}),
      },
    },
  );

  if (!completeResponse.ok) {
    throw new Error(await readErrorMessage(completeResponse));
  }

  const completed = (await completeResponse.json()) as CompleteUploadResponse;

  return {
    fileId: completed.id,
    publicUrl: completed.publicUrl,
    filename: completed.filename,
    mimeType: completed.mimeType,
  };
}
