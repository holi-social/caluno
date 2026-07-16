import type { UploadPurpose } from './upload-file';

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
] as const;

export const IMAGE_ACCEPT = IMAGE_MIME_TYPES.join(',');

const DOCUMENT_PURPOSES = new Set<UploadPurpose>([
  'requirement_document',
  'form_document',
]);

const IMAGE_PURPOSES = new Set<UploadPurpose>([
  'org_logo',
  'organization_logo',
  'event_image',
  'shift_image',
  'profile_picture',
]);

export function getAcceptForPurpose(
  purpose: UploadPurpose,
): string | undefined {
  if (DOCUMENT_PURPOSES.has(purpose)) {
    return undefined;
  }

  if (IMAGE_PURPOSES.has(purpose)) {
    return IMAGE_ACCEPT;
  }

  return undefined;
}

export function isMimeTypeAllowedForPurpose(
  purpose: UploadPurpose,
  _mimeType: string,
): boolean {
  if (DOCUMENT_PURPOSES.has(purpose)) {
    return true;
  }

  if (IMAGE_PURPOSES.has(purpose)) {
    return IMAGE_MIME_TYPES.includes(
      _mimeType as (typeof IMAGE_MIME_TYPES)[number],
    );
  }

  return false;
}
