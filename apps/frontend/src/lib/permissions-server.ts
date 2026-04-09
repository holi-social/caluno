'use server';

import type { PermissionKey } from '@repo/data';
import { redirect } from 'next/navigation';
import { getDataClient } from './data-client';

export async function requirePermission(
  orgUId: string,
  permission: PermissionKey | PermissionKey[],
): Promise<void> {
  const data = await getDataClient(orgUId);
  const permissions = await data.user.getMyPermissions();
  const userKeys = new Set(permissions.map((p) => p.key));
  const required = Array.isArray(permission) ? permission : [permission];

  if (!required.every((key) => userKeys.has(key))) {
    redirect('/unauthorized');
  }
}

export async function hasPermission(
  orgUId: string,
  permission: PermissionKey | PermissionKey[],
): Promise<boolean> {
  const data = await getDataClient(orgUId);
  const permissions = await data.user.getMyPermissions();
  const userKeys = new Set(permissions.map((p) => p.key));
  const required = Array.isArray(permission) ? permission : [permission];

  return required.every((key) => userKeys.has(key));
}
