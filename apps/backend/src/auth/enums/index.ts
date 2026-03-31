export enum PermissionKey {
  ORG_READ = 'org:read',
  ORG_UPDATE = 'org:update',
  ORG_DELETE = 'org:delete',

  ORG_UNIT_CREATE = 'org-unit:create',
  ORG_UNIT_READ = 'org-unit:read',
  ORG_UNIT_UPDATE = 'org-unit:update',
  ORG_UNIT_DELETE = 'org-unit:delete',

  ROLE_CREATE = 'role:create',
  ROLE_READ = 'role:read',
  ROLE_UPDATE = 'role:update',
  ROLE_DELETE = 'role:delete',

  MEMBERSHIP_CREATE = 'membership:create',
  MEMBERSHIP_READ = 'membership:read',
  MEMBERSHIP_UPDATE = 'membership:update',
  MEMBERSHIP_DELETE = 'membership:delete',

  MEMBERSHIP_REQUEST_READ = 'membership-request:read',
  MEMBERSHIP_REQUEST_UPDATE = 'membership-request:update',
  MEMBERSHIP_REQUEST_DELETE = 'membership-request:delete',
  MEMBERSHIP_REQUEST_APPROVE = 'membership-request:approve',
  MEMBERSHIP_REQUEST_REJECT = 'membership-request:reject',
  MEMBERSHIP_REQUEST_CANCEL = 'membership-request:cancel',

  SHIFT_CREATE = 'shift:create',
  SHIFT_READ = 'shift:read',
  SHIFT_UPDATE = 'shift:update',
  SHIFT_DELETE = 'shift:delete',

  TIME_ENTRY_CREATE = 'time-entry:create',
  TIME_ENTRY_READ = 'time-entry:read',
  TIME_ENTRY_UPDATE = 'time-entry:update',
  TIME_ENTRY_DELETE = 'time-entry:delete',
}
