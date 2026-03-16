export const PERMISSIONS = {
  ORG_CREATE: 'org:create',
  ORG_READ: 'org:read',
  ORG_UPDATE: 'org:update',
  ORG_DELETE: 'org:delete',

  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',

  MEMBERSHIP_CREATE: 'membership:create',
  MEMBERSHIP_READ: 'membership:read',
  MEMBERSHIP_UPDATE: 'membership:update',
  MEMBERSHIP_DELETE: 'membership:delete',

  MEMBERSHIP_REQUEST_CREATE: 'membership-request:create',
  MEMBERSHIP_REQUEST_READ: 'membership-request:read',
  MEMBERSHIP_REQUEST_UPDATE: 'membership-request:update',
  MEMBERSHIP_REQUEST_DELETE: 'membership-request:delete',
  MEMBERSHIP_REQUEST_APPROVE: 'membership-request:approve',
  MEMBERSHIP_REQUEST_REJECT: 'membership-request:reject',
  MEMBERSHIP_REQUEST_CANCEL: 'membership-request:cancel',

  PROJECT_CREATE: 'project:create',
  PROJECT_READ: 'project:read',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  PROJECT_PUBLISH: 'project:publish',

  SHIFT_CREATE: 'shift:create',
  SHIFT_READ: 'shift:read',
  SHIFT_UPDATE: 'shift:update',
  SHIFT_DELETE: 'shift:delete',

  TIME_ENTRY_CREATE: 'time-entry:create',
  TIME_ENTRY_READ: 'time-entry:read',
  TIME_ENTRY_UPDATE: 'time-entry:update',
  TIME_ENTRY_DELETE: 'time-entry:delete',

  VOLUNTEER_SESSION_CREATE: 'volunteer-session:create',
  VOLUNTEER_SESSION_READ: 'volunteer-session:read',
  VOLUNTEER_SESSION_UPDATE: 'volunteer-session:update',
  VOLUNTEER_SESSION_DELETE: 'volunteer-session:delete',
  VOLUNTEER_SESSION_APPROVE: 'volunteer-session:approve',
  VOLUNTEER_SESSION_REJECT: 'volunteer-session:reject',
  VOLUNTEER_SESSION_CANCEL: 'volunteer-session:cancel',
} as const;

export const MEMBER_DEFAULT_PERMISSIONS = [
  PERMISSIONS.ORG_READ,
  PERMISSIONS.PROJECT_READ,
  PERMISSIONS.SHIFT_READ,
  PERMISSIONS.TIME_ENTRY_READ,
  PERMISSIONS.TIME_ENTRY_CREATE,
  PERMISSIONS.TIME_ENTRY_UPDATE,
  PERMISSIONS.TIME_ENTRY_DELETE,
  PERMISSIONS.VOLUNTEER_SESSION_READ,
  PERMISSIONS.VOLUNTEER_SESSION_CREATE,
  PERMISSIONS.VOLUNTEER_SESSION_UPDATE,
  PERMISSIONS.VOLUNTEER_SESSION_DELETE,
];

export const DEFAULT_OWNER_ROLE_NAME = 'Owner';
export const DEFAULT_MEMBER_ROLE_NAME = 'Member';

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
