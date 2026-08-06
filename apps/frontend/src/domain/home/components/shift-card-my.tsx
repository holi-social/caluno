'use client';

import { Button, Card } from '@repo/ui';
import {
  Clock4Icon,
  DoorOpenIcon,
  MapPinIcon,
  PlayIcon,
  QrCodeIcon,
  RepeatIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { useRecurrenceLabel } from '../lib/recurrence-label';

type TimerKind = 'far' | 'soon' | 'overdue' | 'active';

export interface ShiftCardMyProps {
  shiftInstance: {
    id: string;
    actualStartsAt: string;
    actualEndsAt: string;
    isCheckedIn: boolean;
    master: {
      id: string;
      title: string;
      location?: string | null;
      rrule?: string | null;
    };
  };
  /** Show the inline time range. Off when an external time rail already shows it. */
  showTime?: boolean;
  /** True when the user signed up but the org-unit membership request is still pending. */
  isPending?: boolean;
}

const THREE_HOURS = 3 * 60 * 60 * 1000;

function useTimer(
  startsAt: string,
  isCheckedIn: boolean,
): { kind: TimerKind; label: string } {
  const { formatDuration } = useFormatting();
  const t = useTranslations('VolunteerHome');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const start = useMemo(() => new Date(startsAt), [startsAt]);
  const diff = start.getTime() - now.getTime();

  if (isCheckedIn) {
    return {
      kind: 'active',
      label: t('timerVolunteering', {
        time: formatDuration(start, now.toISOString()),
      }),
    };
  }

  if (diff <= 0) {
    return {
      kind: 'overdue',
      label: t('timerStartedAgo', {
        time: formatDuration(start, now.toISOString()),
      }),
    };
  }

  const time = formatDuration(now.toISOString(), start.toISOString());
  return {
    kind: diff <= THREE_HOURS ? 'soon' : 'far',
    label: t('timerStartsIn', { time }),
  };
}

export function ShiftCardMy({
  shiftInstance,
  showTime = true,
  isPending = false,
}: ShiftCardMyProps) {
  const t = useTranslations('VolunteerHome');
  const { formatTimeRange } = useFormatting();
  const getRecurrenceLabel = useRecurrenceLabel();
  const recurrence = getRecurrenceLabel(shiftInstance.master.rrule);
  const timer = useTimer(
    shiftInstance.actualStartsAt,
    shiftInstance.isCheckedIn,
  );

  const TimerIcon = timer.kind === 'active' ? PlayIcon : Clock4Icon;
  const showCheckIn = timer.kind === 'soon' || timer.kind === 'overdue';
  const showCheckOut = timer.kind === 'active';

  return (
    <Card className="relative flex flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card p-0">
      <Link
        href={`/shifts/${shiftInstance.master.id}`}
        aria-label={shiftInstance.master.title}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1"
      />
      <div className="flex items-center justify-center gap-2 border-b border-border bg-card px-3 py-2 text-sm text-foreground">
        <TimerIcon className="size-4 shrink-0" />
        <span>{timer.label}</span>
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
          {isPending && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock4Icon className="size-3.5 shrink-0" />
              {t('pendingBadge')}
            </p>
          )}
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

        {showCheckIn && (
          <Button
            asChild
            className="relative z-10 flex h-auto w-[100px] shrink-0 flex-col gap-1 self-stretch rounded-xl bg-primary text-primary-foreground"
          >
            <Link href="/qr-id">
              <QrCodeIcon className="size-5" />
              <span>{t('checkIn')}</span>
            </Link>
          </Button>
        )}
        {showCheckOut && (
          <Button
            asChild
            variant="outline"
            className="relative z-10 flex h-auto w-[100px] shrink-0 flex-col gap-1 self-stretch rounded-xl"
          >
            <Link href="/qr-id">
              <DoorOpenIcon className="size-5" />
              <span>{t('checkOut')}</span>
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
