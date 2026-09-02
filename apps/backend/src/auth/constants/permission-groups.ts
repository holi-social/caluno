import { PermissionKey } from '../enums';

export type PermissionGroupDefinition = {
  key: string;
  label: string;
  permissions: ReadonlyArray<{
    key: PermissionKey;
    label: string;
  }>;
};

export const PERMISSION_GROUPS: readonly PermissionGroupDefinition[] = [
  {
    key: 'organization',
    label: 'Managing organizations',
    permissions: [
      { key: PermissionKey.ORG_VIEW, label: 'View' },
      { key: PermissionKey.ORG_EDIT, label: 'Edit' },
    ],
  },
  {
    key: 'volunteer',
    label: 'Managing volunteers',
    permissions: [
      { key: PermissionKey.VOLUNTEER_VIEW, label: 'View' },
      { key: PermissionKey.VOLUNTEER_EDIT, label: 'Edit' },
    ],
  },
  {
    key: 'shift',
    label: 'Managing shifts',
    permissions: [
      { key: PermissionKey.SHIFT_VIEW, label: 'View' },
      { key: PermissionKey.SHIFT_EDIT, label: 'Edit' },
    ],
  },
  {
    key: 'requirement-profile',
    label: 'Managing requirement profiles',
    permissions: [
      { key: PermissionKey.REQUIREMENT_PROFILE_VIEW, label: 'View' },
      { key: PermissionKey.REQUIREMENT_PROFILE_EDIT, label: 'Edit' },
    ],
  },
  {
    key: 'accounting',
    label: 'Managing accounting',
    permissions: [{ key: PermissionKey.ACCOUNTING_MANAGE, label: 'Manage' }],
  },
  {
    key: 'check-in',
    label: 'Managing check-in',
    permissions: [{ key: PermissionKey.CHECK_IN_MANAGE, label: 'Manage' }],
  },
] as const;
