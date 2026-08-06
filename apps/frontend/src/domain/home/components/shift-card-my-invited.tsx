'use client';

import { Badge, Card } from '@repo/ui';
import { CalendarIcon, MailIcon, MapPinIcon, RepeatIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { useRecurrenceLabel } from '../lib/recurrence-label';

export interface ShiftCardMyInvitedProps {
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
  /** Show the inline time range. Off when an external time rail already shows it. */
  showTime?: boolean;
}

export function ShiftCardMyInvited({
  shiftInstance,
  showTime = true,
}: ShiftCardMyInvitedProps) {
  const t = useTranslations('VolunteerHome');
  const { formatTimeRange, formatDate } = useFormatting();
  const getRecurrenceLabel = useRecurrenceLabel();
  const recurrence = getRecurrenceLabel(shiftInstance.master.rrule);

  return (
    <Card className="relative flex flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card p-0">
      <Link
        href={`/shifts/${shiftInstance.master.id}?instanceId=${shiftInstance.id}`}
        aria-label={shiftInstance.master.title}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1"
      />
      <div className="flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 text-sm text-foreground">
        <div className="flex min-w-0 items-center gap-2">
          <MailIcon className="size-4 shrink-0" />
          <span className="truncate">
            {t('invitedOn', {
              date: formatDate(new Date(shiftInstance.actualStartsAt), {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              }),
            })}
          </span>
        </div>
        <Badge variant="outline" className="shrink-0">
          <CalendarIcon />
          {t('inviteKindShift')}
        </Badge>
      </div>

      <div className="flex gap-3 p-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            {showTime && (
              <p className="font-semibold text-foreground">
                {formatTimeRange(
                  shiftInstance.actualStartsAt,
                  shiftInstance.actualEndsAt,
                )}
              </p>
            )}
            {recurrence && (
              <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                <RepeatIcon className="size-3.5" />
                {recurrence}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {shiftInstance.master.title}
          </h3>
          {shiftInstance.master.location && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPinIcon className="size-3.5 shrink-0" />
              {shiftInstance.master.location}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
