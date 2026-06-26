'use server';

import type { PermissionKey } from '@repo/data';
import { redirect } from 'next/navigation';
import { getDataClient } from './data-client';

export async function checkPermission(
  orgUId: string,
  ...permission: PermissionKey[]
): Promise<boolean[]> {
  const data = await getDataClient(orgUId);
  const permissions = await data.user.getMyPermissions();
  const userKeys = new Set(permissions.map((p) => p.key));
  const required = Array.isArray(permission) ? permission : [permission];

  return required.map((key) => userKeys.has(key));
}

export async function requirePermission(
  orgUId: string,
  ...permission: PermissionKey[]
): Promise<void> {
  const results = await checkPermission(orgUId, ...permission);
  if (!results.every(Boolean)) {
    redirect('/unauthorized');
  }
}
