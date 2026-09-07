'use client';

import { useReimbursementTypes } from '@repo/data/react';
import { ActionTooltip, Badge, cn } from '@repo/ui';
import { GraduationCap, HeartHandshake } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TYPE_COLOR } from '../../accounting/components/doc-type-header';
import { resolvePauschaleMarker } from '../pauschale-marker';

const MARKER_ICON = {
  ehrenamt: HeartHandshake,
  uebungsleiter: GraduationCap,
} as const;

type PauschaleMarkerProps = {
  /** The shift's effective reimbursement type id (instance override, falling
   * back to the master shift's type). Unpaid shifts pass null/undefined and
   * render nothing. */
  reimbursementTypeId?: string | null;
  className?: string;
};

/**
 * A small marker showing a shift is paid and which Pauschale type it carries.
 * Renders nothing for unpaid shifts — there is intentionally no "unpaid"
 * state. Color is always paired with a distinct icon and text label so the
 * marker survives greyscale printing and doesn't rely on color alone.
 */
export function PauschaleMarker({
  reimbursementTypeId,
  className,
}: PauschaleMarkerProps) {
  const { data: types } = useReimbursementTypes();
  const t = useTranslations('Shift.paidMarker');
  const marker = resolvePauschaleMarker(reimbursementTypeId, types);

  if (!marker) {
    return null;
  }

  const Icon = MARKER_ICON[marker];
  const color = TYPE_COLOR[marker];
  const shortLabel = t(
    marker === 'ehrenamt' ? 'ehrenamtShort' : 'uebungsleiterShort',
  );
  const fullLabel = t(marker === 'ehrenamt' ? 'ehrenamt' : 'uebungsleiter');

  return (
    <ActionTooltip label={fullLabel}>
      <Badge
        variant="outline"
        className={cn('shrink-0', className)}
        style={{
          color,
          backgroundColor: `${color}18`,
          borderColor: `${color}40`,
        }}
      >
        <Icon className="size-3" aria-hidden="true" />
        {shortLabel}
      </Badge>
    </ActionTooltip>
  );
}
