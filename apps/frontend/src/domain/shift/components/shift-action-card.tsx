'use client';

import {
  JoinStatus,
  type PublicShiftInstance,
  ShiftInviteStatus,
  type ShiftVisibility,
} from '@repo/data';
import { Badge, Card } from '@repo/ui';
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { JoinShiftButton } from './join-shift-button';
import { ShiftDayPicker } from './shift-day-picker';

interface ShiftActionCardProps {
  shiftId: string;
  organizationUnitId: string;
  instances: PublicShiftInstance[];
  visibility: ShiftVisibility;
  isAuthenticated: boolean;
  autoJoin?: boolean;
  preselectedInstanceId?: string;
  /** The viewer's org-membership state for this shift's org. */
  membershipState: JoinStatus;
}

const isParticipatingInvite = (
  status: ShiftInviteStatus | null | undefined,
): boolean =>
  status === ShiftInviteStatus.Accepted ||
  status === ShiftInviteStatus.SelfJoined;

export function ShiftActionCard({
  shiftId,
  organizationUnitId,
  instances,
  visibility,
  isAuthenticated,
  autoJoin,
  preselectedInstanceId,
  membershipState,
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

  // Optimistic overrides so capacity/CTA update without a reload.
  const [membershipStateOverride, setMembershipStateOverride] =
    useState<JoinStatus | null>(null);
  const [inviteStatusOverrides, setInviteStatusOverrides] = useState<
    Record<string, ShiftInviteStatus>
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
  const inviteStatus =
    inviteStatusOverrides[selected.id] ?? selected.myInviteStatus ?? null;
  const effectiveMembershipState = membershipStateOverride ?? membershipState;
  const justJoined =
    isParticipatingInvite(inviteStatus) &&
    !isParticipatingInvite(selected.myInviteStatus);

  const filled = (selected.filledCount ?? 0) + (justJoined ? 1 : 0);
  const spotsLeft =
    selected.spotsLeft == null
      ? null
      : Math.max(0, selected.spotsLeft - (justJoined ? 1 : 0));
  const full = spotsLeft === 0;
  const unlimited = spotsLeft == null;

  const resolvedMax = max ?? filled + (spotsLeft ?? 0);

  const longDate = formatDate(new Date(selected.actualStartsAt), {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });

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

      {inviteStatus === ShiftInviteStatus.Accepted && (
        <Badge variant="secondary" className="gap-1">
          <CheckIcon className="size-3.5" />
          {t('acceptedBadge')}
        </Badge>
      )}
      {inviteStatus === ShiftInviteStatus.Cancelled && (
        <Badge variant="secondary" className="gap-1">
          <XIcon className="size-3.5" />
          {t('declinedBadge')}
        </Badge>
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
          organizationUnitId={organizationUnitId}
          instanceId={selected.id}
          visibility={visibility}
          isAuthenticated={isAuthenticated}
          autoJoin={autoJoin}
          isFull={full}
          membershipState={effectiveMembershipState}
          onMembershipStateChange={setMembershipStateOverride}
          inviteStatus={inviteStatus}
          onInviteStatusChange={(nextStatus) =>
            setInviteStatusOverrides((previous) => ({
              ...previous,
              [selected.id]: nextStatus,
            }))
          }
          startsAt={selected.actualStartsAt}
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
          {inviteStatus === ShiftInviteStatus.Invited
            ? t('respondBeforeNote', { date: longDate })
            : inviteStatus === ShiftInviteStatus.Accepted
              ? t('cancelUntilNote', { date: longDate })
              : inviteStatus === ShiftInviteStatus.Cancelled
                ? t('cancelledNote', { date: longDate })
                : inviteStatus === ShiftInviteStatus.SelfJoined
                  ? t('joinedNote')
                  : effectiveMembershipState === JoinStatus.Pending
                    ? t('pendingNote')
                    : full
                      ? t('fullNote')
                      : t('signUpNote')}
        </p>
      </div>
    </Card>
  );
}
