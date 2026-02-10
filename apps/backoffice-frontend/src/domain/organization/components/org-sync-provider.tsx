'use client';

import { setLastVisitedOrg } from '@repo/data/react';
import { type ReactNode, useEffect } from 'react';

export function OrgSyncProvider({
  children,
  orgSlug,
}: {
  children: ReactNode;
  orgSlug: string;
}) {
  useEffect(() => {
    setLastVisitedOrg(orgSlug);
  }, [orgSlug]);

  return <>{children}</>;
}
