import { PermissionKey } from '../enums';

export const PERMISSIONS = PermissionKey;

export const MEMBER_DEFAULT_PERMISSIONS = [
  PERMISSIONS.ORG_READ,
  PERMISSIONS.SHIFT_READ,
  PERMISSIONS.TIME_ENTRY_READ,
  PERMISSIONS.TIME_ENTRY_CREATE,
  PERMISSIONS.TIME_ENTRY_UPDATE,
  PERMISSIONS.TIME_ENTRY_DELETE,
];

export const DEFAULT_OWNER_ROLE_NAME = 'Owner';
export const DEFAULT_MEMBER_ROLE_NAME = 'Member';

export type Permission = PermissionKey;
