import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { requireOrgAccess } from '@/lib/org-context-server';

interface AccountingLayoutProps {
  children: ReactNode;
  params: Promise<{ orgUId: string }>;
}

/**
 * Gates the whole backoffice accounting surface on the organization's
 * `accountingEnabled` flag. The sidebar already hides the nav item when the
 * flag is off; this keeps the routes themselves unreachable too — a disabled
 * org gets a 404, as if the feature didn't exist.
 */
export default async function AccountingLayout({
  children,
  params,
}: AccountingLayoutProps) {
  const { orgUId } = await params;
  const { org } = await requireOrgAccess(orgUId);
  if (!org.accountingEnabled) {
    notFound();
  }
  return children;
}
