'use client';

import { ActionBar } from '@/domain/shift/components/action-bar';
import { useRouter } from '@/i18n/navigation';

type ShiftViewActionBarProps = {
  id: string;
  organizationUnitId: string;
  size?: 'xs' | 'sm' | 'md';
};

export function ShiftViewActionBar({
  id,
  organizationUnitId,
  size,
}: ShiftViewActionBarProps) {
  const router = useRouter();

  return (
    <ActionBar
      id={id}
      organizationUnitId={organizationUnitId}
      size={size}
      onDeleteSuccess={() => router.push(`/admin/${organizationUnitId}/shifts`)}
    />
  );
}
