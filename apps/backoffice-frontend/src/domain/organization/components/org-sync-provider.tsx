'use client';

import { setLastVisitedOrg } from '@repo/data/react';
import { type ReactNode, useEffect } from 'react';

export function OrgSyncProvider({
  children,
  orgId,
}: {
  children: ReactNode;
  orgId: string;
}) {
  useEffect(() => {
    setLastVisitedOrg(orgId);
  }, [orgId]);

  return <>{children}</>;
}
