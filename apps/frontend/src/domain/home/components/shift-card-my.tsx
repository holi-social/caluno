'use client';

import { Button, Card, CardContent, cn } from '@repo/ui';
import {
  BellRingIcon,
  Clock4Icon,
  DoorOpenIcon,
  MapPinIcon,
  PlayIcon,
  QrCodeIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { useRecurrenceLabel } from '../lib/recurrence-label';

type TimerState =
  | { kind: 'far'; label: string }
  | { kind: 'soon'; label: string }
  | { kind: 'overdue'; label: string }
  | { kind: 'active'; label: string };

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
  timerStartsInLabel: string;
  timerStartedAgoLabel: string;
  timerVolunteeringLabel: string;
  checkInLabel: string;
  checkOutLabel: string;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

const THREE_HOURS = 3 * 60 * 60 * 1000;

function useTimerState(
  startsAt: string,
  isCheckedIn: boolean,
  timerStartsInLabel: string,
  timerStartedAgoLabel: string,
  timerVolunteeringLabel: string,
): TimerState {
  const { formatDuration } = useFormatting();
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
      label: timerVolunteeringLabel.replace(
        '{time}',
        formatDuration(start, now.toISOString()),
      ),
    };
  }

  if (diff <= 0) {
    return {
      kind: 'overdue',
      label: timerStartedAgoLabel.replace(
        '{time}',
        formatDuration(start, now.toISOString()),
      ),
    };
  }

  if (diff <= THREE_HOURS) {
    return {
      kind: 'soon',
      label: timerStartsInLabel.replace(
        '{time}',
        formatDuration(now.toISOString(), start.toISOString()),
      ),
    };
  }

  return {
    kind: 'far',
    label: timerStartsInLabel.replace(
      '{time}',
      formatDuration(now.toISOString(), start.toISOString()),
    ),
  };
}

export function ShiftCardMy({
  shiftInstance,
  timerStartsInLabel,
  timerStartedAgoLabel,
  timerVolunteeringLabel,
  checkInLabel,
  checkOutLabel,
  onCheckIn,
  onCheckOut,
}: ShiftCardMyProps) {
  const { formatTimeRange } = useFormatting();
  const getRecurrenceLabel = useRecurrenceLabel();
  const timer = useTimerState(
    shiftInstance.actualStartsAt,
    shiftInstance.isCheckedIn,
    timerStartsInLabel,
    timerStartedAgoLabel,
    timerVolunteeringLabel,
  );

  const TimerIcon = {
    far: Clock4Icon,
    soon: Clock4Icon,
    overdue: BellRingIcon,
    active: PlayIcon,
  }[timer.kind];

  const showCheckIn = timer.kind === 'soon' || timer.kind === 'overdue';
  const showCheckOut = timer.kind === 'active';

  return (
    <Card className="rounded-xl border border-border bg-card p-3">
      <div
        className={cn(
          'flex items-center gap-2 rounded-t-lg bg-muted px-3 py-2 text-sm',
          timer.kind === 'overdue' && 'text-alert',
        )}
      >
        <TimerIcon className="size-4 shrink-0" />
        <span>{timer.label}</span>
      </div>
      <div className="flex rounded-b-lg border-x border-b">
        <CardContent className="flex-1 p-3">
          <p className="text-sm text-muted-foreground">
            {formatTimeRange(
              shiftInstance.actualStartsAt,
              shiftInstance.actualEndsAt,
            )}
          </p>
          <h3 className="font-semibold text-foreground">
            {shiftInstance.master.title}
          </h3>
          {shiftInstance.master.rrule && (
            <p className="text-sm text-muted-foreground">
              {getRecurrenceLabel(shiftInstance.master.rrule)}
            </p>
          )}
          {shiftInstance.master.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPinIcon className="size-3 shrink-0" />
              {shiftInstance.master.location}
            </p>
          )}
        </CardContent>

        {(showCheckIn || showCheckOut) && (
          <div className="w-[100px] border-l">
            {showCheckIn && (
              <Button
                onClick={onCheckIn}
                className="h-full w-full rounded-none rounded-br-lg bg-primary text-primary-foreground flex flex-col gap-1"
              >
                <QrCodeIcon className="size-5" />
                <span>{checkInLabel}</span>
              </Button>
            )}
            {showCheckOut && (
              <Button
                variant="outline"
                onClick={onCheckOut}
                className="h-full w-full rounded-none rounded-br-lg flex flex-col gap-1"
              >
                <DoorOpenIcon className="size-5" />
                <span>{checkOutLabel}</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
