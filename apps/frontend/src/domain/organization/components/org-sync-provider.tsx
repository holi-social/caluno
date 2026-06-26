'use client';

import { setLastVisitedOrg } from '@repo/data/react';
import { type ReactNode, useEffect } from 'react';

export function OrgSyncProvider({
  children,
  orgUId,
}: {
  children: ReactNode;
  orgUId: string;
}) {
  useEffect(() => {
    setLastVisitedOrg(orgUId);
  }, [orgUId]);

  return <>{children}</>;
}
