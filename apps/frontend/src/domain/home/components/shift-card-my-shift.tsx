'use client';

import { Card, cn } from '@repo/ui';
import { Clock4Icon, MapPinIcon, RepeatIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { shiftPublicPath } from '@/domain/shift/share';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { useRecurrenceLabel } from '../lib/recurrence-label';

export interface ShiftCardMyShiftProps {
  shiftInstance: {
    id: string;
    actualStartsAt: string;
    actualEndsAt: string;
    master: {
      id: string;
      title: string;
      location?: string | null;
      rrule?: string | null;
    };
  };
  /** Show the shift's date (used in the home preview where there is no day head). */
  showDate?: boolean;
  /** Past shift: dimmed and non-interactive (no link). */
  past?: boolean;
  /** Show the inline time range. Off when an external time rail already shows it. */
  showTime?: boolean;
  /** True when the user signed up but the org-unit membership request is still pending. */
  isPending?: boolean;
}

export function ShiftCardMyShift({
  shiftInstance,
  showDate = false,
  past = false,
  showTime = true,
  isPending = false,
}: ShiftCardMyShiftProps) {
  const t = useTranslations('VolunteerHome');
  const { formatTimeRange, formatDate } = useFormatting();
  const getRecurrenceLabel = useRecurrenceLabel();
  const recurrence = getRecurrenceLabel(shiftInstance.master.rrule);

  const card = (
    <Card
      className={cn(
        'flex h-full w-full flex-col gap-1 rounded-xl border border-border bg-card p-3',
        past && 'opacity-55',
      )}
    >
      {showDate && (
        <p className="text-sm font-semibold text-foreground">
          {formatDate(new Date(shiftInstance.actualStartsAt), {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </p>
      )}
      {showTime && (
        <p className="text-sm text-muted-foreground">
          {formatTimeRange(
            shiftInstance.actualStartsAt,
            shiftInstance.actualEndsAt,
          )}
        </p>
      )}
      {recurrence && (
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <RepeatIcon className="size-3.5 shrink-0" />
          {recurrence}
        </span>
      )}
      {isPending && (
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock4Icon className="size-3.5 shrink-0" />
          {t('pendingBadge')}
        </p>
      )}
      <h3 className="line-clamp-2 font-semibold text-foreground">
        {shiftInstance.master.title}
      </h3>
      {shiftInstance.master.location && (
        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
          <MapPinIcon className="size-3 shrink-0" />
          {shiftInstance.master.location}
        </p>
      )}
    </Card>
  );

  // Past shifts are read-only (AC33) — no link.
  if (past) return card;

  return (
    <Link
      href={shiftPublicPath(shiftInstance.master.id, shiftInstance.id)}
      prefetch={false}
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1"
    >
      {card}
    </Link>
  );
}
