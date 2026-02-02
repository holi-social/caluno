'use client';

import { type ReactNode, useEffect } from 'react';
import { setLastVisitedOrg } from '@/lib/org-context-client';

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
