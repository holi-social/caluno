'use client';

import { ActionBar } from '@/domain/shift/components/action-bar';
import { type ShiftListQuery, shiftsListPath } from '@/domain/shift/routes';
import { useRouter } from '@/i18n/navigation';

type ShiftViewActionBarProps = {
  id: string;
  organizationUnitId: string;
  size?: 'xs' | 'sm' | 'md';
  returnQuery: ShiftListQuery;
};

export function ShiftViewActionBar({
  id,
  organizationUnitId,
  size,
  returnQuery,
}: ShiftViewActionBarProps) {
  const router = useRouter();

  return (
    <ActionBar
      id={id}
      organizationUnitId={organizationUnitId}
      size={size}
      onDeleteSuccess={() =>
        router.push(shiftsListPath(organizationUnitId, returnQuery))
      }
    />
  );
}
