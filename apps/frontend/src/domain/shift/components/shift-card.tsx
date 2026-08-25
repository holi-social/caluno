'use client';

import {
  formatRrulePattern,
  ShiftVisibility,
  type WeeklyShiftInstance,
} from '@repo/data';
import {
  ActionTooltip,
  Badge,
  Button,
  Card,
  type VolunteeringShiftCardVolunteer,
  VolunteeringShiftCardVolunteers,
} from '@repo/ui';
import { format } from 'date-fns';
import {
  LockKeyhole,
  RepeatIcon,
  TriangleAlert,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { toInviteDisplayState } from '../invite-status-display';
import { shiftInstanceDetailPath, shiftInvitePath } from '../routes';

type ShiftCardProps = {
  instance: WeeklyShiftInstance;
  canManage?: boolean;
  orgUId: string;
};

function getStaffingState(
  count: number,
  min: number | null | undefined,
  max: number | null | undefined,
) {
  if (max != null && count >= max) {
    return 'full' as const;
  }
  if (count === 0 || (min != null && count < min)) {
    return 'alert' as const;
  }
  return 'neutral' as const;
}

function StaffingBadge({
  count,
  min,
  max,
  interactive,
}: {
  count: number;
  min: number | null | undefined;
  max: number | null | undefined;
  interactive?: boolean;
}) {
  const state = getStaffingState(count, min, max);

  const variant =
    state === 'full' ? 'success' : state === 'alert' ? 'alert' : 'outline';

  const showTriangle =
    state === 'alert' && min != null && count < min && count > 0;
  const Icon = showTriangle ? TriangleAlert : UsersRound;

  let text: string;
  if (state === 'full' && max != null) {
    text = `${max}/${max}`;
  } else if (state === 'alert' && min != null && count > 0) {
    text = `${count}/${min}`;
  } else if (max != null) {
    text = `${count}/${max}`;
  } else {
    text = `${count}`;
  }

  return (
    <Badge
      variant={variant}
      className={`flex-1 justify-center self-stretch gap-1${interactive ? ' cursor-pointer' : ''}`}
    >
      <Icon className="size-3" />
      {text}
    </Badge>
  );
}

export function ShiftCard({
  instance,
  canManage = false,
  orgUId,
}: ShiftCardProps) {
  const t = useTranslations('Shift');

  const participatingCount = instance.volunteers?.length ?? 0;
  const invites = instance.invites ?? [];
  const min = instance.overrideMinVolunteers ?? instance.master.minVolunteers;
  const max = instance.overrideMaxVolunteers ?? instance.master.maxVolunteers;
  const state = getStaffingState(participatingCount, min, max);

  const isAtCapacity = max != null && participatingCount >= max;
  const showButton = canManage && !isAtCapacity;
  const buttonVariant = state === 'alert' ? 'default' : 'outline';

  const startTime = format(new Date(instance.actualStartsAt), 'HH:mm');
  const endTime = format(new Date(instance.actualEndsAt), 'HH:mm');

  const cardVolunteers: VolunteeringShiftCardVolunteer[] = invites.map(
    (invite) => ({
      id: invite.user.id,
      name: invite.user.name,
      state: toInviteDisplayState(invite),
    }),
  );

  const instanceHref = shiftInstanceDetailPath(
    orgUId,
    instance.master.id,
    instance.id,
  );

  return (
    <Card className="min-w-0 rounded-xl gap-1 shadow-sm pt-4 pb-2 px-2 overflow-hidden">
      <div className="flex flex-col gap-2 items-end">
        <Link
          href={instanceHref}
          className="flex w-full min-w-0 flex-col gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t('card.openInstanceAria')}
        >
          <p className="flex w-full min-w-0 items-center justify-between gap-1 text-base font-bold leading-none text-muted-foreground">
            <span className="min-w-0 tabular-nums">
              {startTime} - {endTime}
            </span>
            {instance.master.rrule && (
              <ActionTooltip label={formatRrulePattern(instance.master.rrule)}>
                <span className="inline-flex shrink-0 text-muted-foreground">
                  <RepeatIcon className="size-3.5" />
                </span>
              </ActionTooltip>
            )}
          </p>
          <p className="line-clamp-2 text-lg text-card-foreground">
            {instance.overrideTitle ?? instance.master.title}
          </p>
        </Link>

        <div className="flex w-full items-stretch gap-1">
          {showButton ? (
            <Link
              href={shiftInvitePath(orgUId, instance.master.id, instance.id)}
              className="flex flex-1"
            >
              <StaffingBadge
                count={participatingCount}
                min={min}
                max={max}
                interactive
              />
            </Link>
          ) : (
            <StaffingBadge count={participatingCount} min={min} max={max} />
          )}

          {showButton && (
            <Link
              href={shiftInvitePath(orgUId, instance.master.id, instance.id)}
            >
              <Button
                size="icon-sm"
                variant={buttonVariant}
                tooltip={t('card.inviteAria')}
              >
                <UserPlus className="size-4" />
              </Button>
            </Link>
          )}
        </div>

        {instance.master.visibility === ShiftVisibility.InvitedMembers && (
          <span className="flex w-full items-center gap-1 text-sm text-muted-foreground">
            <LockKeyhole className="size-3" />
            {t('visibility.INVITED_MEMBERS')}
          </span>
        )}
      </div>

      <VolunteeringShiftCardVolunteers
        volunteers={cardVolunteers}
        phase="before"
        sectionLabel={t('card.invited')}
      />
    </Card>
  );
}
