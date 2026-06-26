'use client';

import type { PermissionKey } from '@repo/data';
import { useHasPermission } from '@repo/data/react';
import type { ReactNode } from 'react';

interface RequirePermissionProps {
  permission: PermissionKey | PermissionKey[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequirePermission({
  permission,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const hasPermission = useHasPermission(permission);
  return hasPermission ? children : fallback;
}
