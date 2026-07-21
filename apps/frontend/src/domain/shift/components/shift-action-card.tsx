'use client';

import {
  JoinStatus,
  type PublicShiftInstance,
  type ShiftVisibility,
} from '@repo/data';
import { Card } from '@repo/ui';
import { CalendarIcon, ClockIcon, UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { JoinShiftButton } from './join-shift-button';
import { ShiftDayPicker } from './shift-day-picker';

interface ShiftActionCardProps {
  shiftId: string;
  instances: PublicShiftInstance[];
  visibility: ShiftVisibility;
  isAuthenticated: boolean;
  autoJoin?: boolean;
  preselectedInstanceId?: string;
}

export function ShiftActionCard({
  shiftId,
  instances,
  visibility,
  isAuthenticated,
  autoJoin,
  preselectedInstanceId,
}: ShiftActionCardProps) {
  const t = useTranslations('ShiftDetail');
  const { formatTimeRange, formatDate } = useFormatting();
  const [selectedId, setSelectedId] = useState(() => {
    if (preselectedInstanceId) {
      return preselectedInstanceId;
    }
    const now = Date.now();
    const nextUpcoming = instances.find(
      (i) => new Date(i.actualStartsAt).getTime() >= now,
    );
    return (nextUpcoming ?? instances[0])?.id ?? '';
  });

  // Overrides the server-fetched myJoinStatus per instance once the visitor
  // successfully joins, so the capacity text updates immediately without a
  // full page reload.
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, JoinStatus>
  >({});

  const selected = useMemo(
    () => instances.find((i) => i.id === selectedId) ?? instances[0],
    [instances, selectedId],
  );

  if (!selected) {
    return null;
  }

  const isRecurring = instances.length > 1;
  const max = selected.overrideMaxVolunteers ?? undefined;
  const joinStatus = statusOverrides[selected.id] ?? selected.myJoinStatus;
  const justJoined =
    joinStatus === JoinStatus.Joined &&
    selected.myJoinStatus !== JoinStatus.Joined;

  const filled = (selected.filledCount ?? 0) + (justJoined ? 1 : 0);
  const spotsLeft =
    selected.spotsLeft == null
      ? null
      : Math.max(0, selected.spotsLeft - (justJoined ? 1 : 0));
  const full = spotsLeft === 0;
  const unlimited = spotsLeft == null;

  const resolvedMax = max ?? filled + (spotsLeft ?? 0);

  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-foreground">
          <ClockIcon className="size-6" />
          <span className="text-2xl font-bold">
            {formatTimeRange(selected.actualStartsAt, selected.actualEndsAt)}
          </span>
        </div>

        {!isRecurring && (
          <div className="flex items-center gap-2 text-foreground">
            <CalendarIcon className="size-6" />
            <span className="text-xl font-bold">
              {formatDate(new Date(selected.actualStartsAt), {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
        )}
      </div>

      {isRecurring && (
        <ShiftDayPicker
          instances={instances}
          selectedId={selected.id}
          onSelect={setSelectedId}
        />
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-sm">
          <UsersIcon className="size-5 text-foreground" />
          {unlimited ? (
            <span className="text-muted-foreground">{t('spotsUnlimited')}</span>
          ) : (
            <span>
              <span className="font-semibold text-foreground">
                {t('spotsTaken', { filled, max: resolvedMax })}
              </span>{' '}
              <span className="text-muted-foreground">
                {full ? t('spotsFull') : t('spotsFree', { n: spotsLeft })}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <JoinShiftButton
          key={selected.id}
          shiftId={shiftId}
          instanceId={selected.id}
          visibility={visibility}
          isAuthenticated={isAuthenticated}
          autoJoin={autoJoin}
          isFull={full}
          status={joinStatus}
          onStatusChange={(nextStatus) =>
            setStatusOverrides((previous) => ({
              ...previous,
              [selected.id]: nextStatus,
            }))
          }
          className="w-full"
          label={t('signUpCta', {
            date: formatDate(new Date(selected.actualStartsAt), {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            }),
          })}
        />
        <p className="text-center text-sm text-muted-foreground">
          {joinStatus === JoinStatus.Joined
            ? t('joinedNote')
            : joinStatus === JoinStatus.Pending
              ? t('pendingNote')
              : full
                ? t('fullNote')
                : t('signUpNote')}
        </p>
      </div>
    </Card>
  );
}
