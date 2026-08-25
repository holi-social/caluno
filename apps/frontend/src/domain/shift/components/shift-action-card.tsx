'use client';

import {
  JoinStatus,
  type PublicShiftInstance,
  type ShiftInviteOrigin,
  type ShiftInviteStatus,
  type ShiftVisibility,
} from '@repo/data';
import type { RequiredForm } from '@repo/data/react';
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
import {
  isParticipatingInvite,
  toInviteDisplayState,
} from '../invite-status-display';
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
  /** Master capacity, used when the instance has no override. */
  masterMaxVolunteers?: number | null;
  /** Required forms configured on the shift itself. */
  shiftRequiredForms?: RequiredForm[];
  /** Required forms configured on the shift's organization unit. */
  organizationUnitRequiredForms?: RequiredForm[];
}

const isParticipatingInviteStatus = (
  origin: ShiftInviteOrigin | null | undefined,
  status: ShiftInviteStatus | null | undefined,
): boolean => isParticipatingInvite({ origin, status });

export function ShiftActionCard({
  shiftId,
  organizationUnitId,
  instances,
  visibility,
  isAuthenticated,
  autoJoin,
  preselectedInstanceId,
  membershipState,
  masterMaxVolunteers,
  shiftRequiredForms = [],
  organizationUnitRequiredForms = [],
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
  const [inviteOverrides, setInviteOverrides] = useState<
    Record<
      string,
      {
        origin: ShiftInviteOrigin | null;
        status: ShiftInviteStatus | null;
      }
    >
  >({});
  const [pendingInstanceIds, setPendingInstanceIds] = useState<Set<string>>(
    new Set(),
  );

  const selected = useMemo(
    () => instances.find((i) => i.id === selectedId) ?? instances[0],
    [instances, selectedId],
  );

  if (!selected) {
    return null;
  }

  const isRecurring = instances.length > 1;
  const max =
    selected.overrideMaxVolunteers ?? masterMaxVolunteers ?? undefined;
  const inviteOverride = inviteOverrides[selected.id];
  const inviteOrigin =
    inviteOverride?.origin ?? selected.myInviteOrigin ?? null;
  const inviteStatus = inviteOverride
    ? inviteOverride.status
    : (selected.myInviteStatus ?? null);
  const selectedInvite = { origin: inviteOrigin, status: inviteStatus };
  const effectiveMembershipState = membershipStateOverride ?? membershipState;
  const isPendingIntended =
    selected.isIntendingToJoin || pendingInstanceIds.has(selected.id);
  const justJoined =
    isParticipatingInviteStatus(inviteOrigin, inviteStatus) &&
    !isParticipatingInviteStatus(
      selected.myInviteOrigin,
      selected.myInviteStatus,
    );

  const filled = (selected.filledCount ?? 0) + (justJoined ? 1 : 0);
  const spotsLeft =
    selected.spotsLeft == null
      ? null
      : Math.max(0, selected.spotsLeft - (justJoined ? 1 : 0));
  const full = spotsLeft === 0;
  const unlimited = spotsLeft == null;
  const resolvedMax = max ?? (spotsLeft != null ? filled + spotsLeft : filled);

  const longDate = formatDate(new Date(selected.actualStartsAt), {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });

  const getInviteStatusNote = () => {
    if (inviteOrigin == null && inviteStatus == null) {
      if (effectiveMembershipState === JoinStatus.Pending) {
        return t('pendingNote');
      }
      return full ? t('fullNote') : t('signUpNote');
    }
    switch (toInviteDisplayState(selectedInvite)) {
      case 'invited':
        return t('respondBeforeNote', { date: longDate });
      case 'accepted':
        return t('cancelUntilNote', { date: longDate });
      case 'cancelled':
        return t('cancelledNote', { date: longDate });
      case 'signed_up':
        return t('joinedNote');
      case 'declined':
        return t('declinedNote');
      default:
        if (effectiveMembershipState === JoinStatus.Pending) {
          return t('pendingNote');
        }
        return full ? t('fullNote') : t('signUpNote');
    }
  };

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

      {toInviteDisplayState(selectedInvite) === 'accepted' && (
        <Badge variant="secondary" className="gap-1">
          <CheckIcon className="size-3.5" />
          {t('acceptedBadge')}
        </Badge>
      )}
      {toInviteDisplayState(selectedInvite) === 'cancelled' && (
        <Badge variant="secondary" className="gap-1">
          <XIcon className="size-3.5" />
          {t('cancelledBadge')}
        </Badge>
      )}

      {!unlimited && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm">
            <UsersIcon className="size-5 text-foreground" />
            <span>
              <span className="font-semibold text-foreground">
                {t('spotsTaken', { filled, max: resolvedMax })}
              </span>{' '}
              <span className="text-muted-foreground">
                {full ? t('spotsFull') : t('spotsFree', { n: spotsLeft })}
              </span>
            </span>
          </div>
        </div>
      )}

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
          onMembershipStateChange={(nextStatus) => {
            setMembershipStateOverride(nextStatus);
            if (nextStatus === JoinStatus.Pending) {
              setPendingInstanceIds((previous) =>
                new Set(previous).add(selected.id),
              );
            }
          }}
          inviteOrigin={inviteOrigin}
          inviteStatus={inviteStatus}
          onInviteChange={(nextInvite) =>
            setInviteOverrides((previous) => ({
              ...previous,
              [selected.id]: nextInvite,
            }))
          }
          isPendingIntended={isPendingIntended}
          startsAt={selected.actualStartsAt}
          shiftRequiredForms={shiftRequiredForms}
          instanceRequiredForms={selected.requiredForms?.map((ref) => ref.form)}
          organizationUnitRequiredForms={organizationUnitRequiredForms}
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
          {getInviteStatusNote()}
        </p>
      </div>
    </Card>
  );
}
