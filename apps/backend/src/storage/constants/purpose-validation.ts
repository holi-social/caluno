import { FilePurpose } from '../enums';

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
] as const;

export interface PurposeValidationRule {
  visibility: 'private' | 'public';
  maxByteSize: number;
  /** Empty = any MIME type (document uploads). Non-empty = allow-list only. */
  allowedMimeTypes: readonly string[];
  requiredPermission: string;
  requiresOrganizationUnitId: boolean;
}

export const PURPOSE_VALIDATION_RULES: Record<
  FilePurpose,
  PurposeValidationRule
> = {
  [FilePurpose.REQUIREMENT_DOCUMENT]: {
    visibility: 'private',
    maxByteSize: 10 * 1024 * 1024,
    allowedMimeTypes: [],
    requiredPermission: 'org:view',
    requiresOrganizationUnitId: true,
  },
  // Server-generated documents (rendered contract/invoice PDFs) — uploaded
  // via FileService.saveGeneratedFile, never through the presigned path.
  [FilePurpose.DOCUMENT]: {
    visibility: 'public',
    maxByteSize: 25 * 1024 * 1024,
    allowedMimeTypes: ['application/pdf'],
    requiredPermission: 'org:view',
    requiresOrganizationUnitId: true,
  },
  [FilePurpose.FORM_DOCUMENT]: {
    visibility: 'public',
    maxByteSize: 10 * 1024 * 1024,
    allowedMimeTypes: [],
    requiredPermission: 'requirement-profile:edit',
    requiresOrganizationUnitId: true,
  },
  [FilePurpose.ORG_LOGO]: {
    visibility: 'public',
    maxByteSize: 2 * 1024 * 1024,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    requiredPermission: 'org:edit',
    requiresOrganizationUnitId: true,
  },
  [FilePurpose.ORGANIZATION_LOGO]: {
    visibility: 'public',
    maxByteSize: 2 * 1024 * 1024,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    requiredPermission: 'org:edit',
    requiresOrganizationUnitId: false,
  },
  [FilePurpose.EVENT_IMAGE]: {
    visibility: 'public',
    maxByteSize: 2 * 1024 * 1024,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    requiredPermission: 'shift:edit',
    requiresOrganizationUnitId: true,
  },
  [FilePurpose.SHIFT_IMAGE]: {
    visibility: 'public',
    maxByteSize: 2 * 1024 * 1024,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    requiredPermission: 'shift:edit',
    requiresOrganizationUnitId: true,
  },
  [FilePurpose.PROFILE_PICTURE]: {
    visibility: 'public',
    maxByteSize: 2 * 1024 * 1024,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    requiredPermission: 'org:view',
    requiresOrganizationUnitId: false,
  },
};

export function isMimeTypeAllowed(
  rule: PurposeValidationRule,
  mimeType: string,
): boolean {
  if (rule.allowedMimeTypes.length === 0) {
    return true;
  }

  return rule.allowedMimeTypes.includes(mimeType);
}

export function sanitizeFilename(filename: string): string {
  const baseName = filename.split(/[/\\]/).pop() ?? 'file';
  const sanitized = baseName
    .replace(/[^\w.\-() ]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 180);

  return sanitized.length > 0 ? sanitized : 'file';
}
