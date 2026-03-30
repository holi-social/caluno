import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const authRelations = defineRelationsPart(schema, (r) => ({
  users: {
    sessions: r.many.sessions({
      from: r.users.id,
      to: r.sessions.userId,
    }),
    accounts: r.many.accounts({
      from: r.users.id,
      to: r.accounts.userId,
    }),
    memberships: r.many.memberships({
      from: r.users.id,
      to: r.memberships.userId,
    }),
    shiftInvites: r.many.shiftInvites({
      from: r.users.id,
      to: r.shiftInvites.userId,
    }),
  },
  sessions: {
    users: r.one.users({
      from: r.sessions.userId,
      to: r.users.id,
    }),
  },
  accounts: {
    users: r.one.users({
      from: r.accounts.userId,
      to: r.users.id,
    }),
  },
  roles: {
    organizationUnit: r.one.organizationUnits({
      from: r.roles.organizationUnitId,
      to: r.organizationUnits.id,
    }),
    permissions: r.many.rolePermissions({
      from: r.roles.id,
      to: r.rolePermissions.roleId,
    }),
    memberships: r.many.memberships({
      from: r.roles.id,
      to: r.memberships.roleId,
    }),
  },
  permissions: {
    roles: r.many.rolePermissions({
      from: r.permissions.id,
      to: r.rolePermissions.permissionId,
    }),
  },
  rolePermissions: {
    role: r.one.roles({
      from: r.rolePermissions.roleId,
      to: r.roles.id,
    }),
    permission: r.one.permissions({
      from: r.rolePermissions.permissionId,
      to: r.permissions.id,
    }),
  },
}));
