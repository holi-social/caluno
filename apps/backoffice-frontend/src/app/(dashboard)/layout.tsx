import type { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth-server';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuth();

  return <>{children}</>;
}
