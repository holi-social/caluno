'use server'

import type { PermissionKey } from '@repo/data';
import { redirect } from 'next/navigation';
import { getDataClient } from './data-client';

export async function requirePermission(
  orgId: string,
  permission: PermissionKey | PermissionKey[],
): Promise<void> {
  const data = await getDataClient(orgId);
  const permissions = await data.user.getMyPermissions();
  const userKeys = new Set(permissions.map((p) => p.key));
  const required = Array.isArray(permission) ? permission : [permission];

  if (!required.every((key) => userKeys.has(key))) {
    redirect('/unauthorized');
  }
}

export async function hasPermission(
  orgId: string,
  permission: PermissionKey | PermissionKey[],
): Promise<boolean> {
  const data = await getDataClient(orgId);
  const permissions = await data.user.getMyPermissions();
  const userKeys = new Set(permissions.map((p) => p.key));
  const required = Array.isArray(permission) ? permission : [permission];

  return required.every((key) => userKeys.has(key));
}
