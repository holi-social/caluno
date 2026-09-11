'use client';

import {
  formatRrulePattern,
  ShiftInviteStatus,
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
import {
  LockKeyhole,
  RepeatIcon,
  TriangleAlert,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Link, useRouter } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { updateShiftInstanceInviteStatus } from '../actions';
import {
  partitionInvitesByWaitlist,
  toInviteDisplayState,
} from '../invite-status-display';
import { shiftInstanceDetailPath, shiftInvitePath } from '../routes';
import { getStaffingState, staffingBadgeText } from '../staffing';
import { PauschaleMarker } from './pauschale-marker';

type ShiftCardProps = {
  instance: WeeklyShiftInstance;
  canManage?: boolean;
  orgUId: string;
};

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

  return (
    <Badge
      variant={variant}
      className={`flex-1 justify-center self-stretch gap-1${interactive ? ' cursor-pointer' : ''}`}
    >
      <Icon className="size-3" />
      {staffingBadgeText(count, min, max, state)}
    </Badge>
  );
}

export function ShiftCard({
  instance,
  canManage = false,
  orgUId,
}: ShiftCardProps) {
  const t = useTranslations('Shift');
  const { formatTime } = useFormatting();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const participatingCount = instance.volunteers?.length ?? 0;
  const { invites, waitlisted } = partitionInvitesByWaitlist(
    instance.invites ?? [],
  );
  const min = instance.overrideMinVolunteers ?? instance.master.minVolunteers;
  const max = instance.overrideMaxVolunteers ?? instance.master.maxVolunteers;
  const state = getStaffingState(participatingCount, min, max);

  const isAtCapacity = max != null && participatingCount >= max;
  const showButton = canManage && !isAtCapacity;
  const buttonVariant = state === 'alert' ? 'default' : 'outline';

  const startTime = formatTime(new Date(instance.actualStartsAt));
  const endTime = formatTime(new Date(instance.actualEndsAt));

  const invitedVolunteers: VolunteeringShiftCardVolunteer[] = invites.map(
    (invite) => ({
      id: invite.user.id,
      name: invite.user.name,
      state: toInviteDisplayState(invite.status as ShiftInviteStatus),
    }),
  );

  const waitlistVolunteers: VolunteeringShiftCardVolunteer[] = waitlisted.map(
    (invite) => ({
      id: invite.user.id,
      name: invite.user.name,
      state: 'waitlisted',
      action: canManage ? (
        <Button
          size="icon-sm"
          variant="outline"
          tooltip={t('card.inviteToShift')}
          disabled={pending}
          onClick={() => inviteFromWaitlist(invite.user.id)}
        >
          <UserPlus className="size-4" />
        </Button>
      ) : undefined,
    }),
  );

  const inviteFromWaitlist = (userId: string) => {
    startTransition(async () => {
      const result = await updateShiftInstanceInviteStatus(
        orgUId,
        instance.id,
        {
          userId,
          status: ShiftInviteStatus.Joined,
        },
      );
      if (result?.serverError) {
        toast.error(t('card.waitlistInviteError'));
        return;
      }
      toast.success(t('card.waitlistInviteSuccess'));
      router.refresh();
    });
  };

  const instanceHref = shiftInstanceDetailPath(
    orgUId,
    instance.master.id,
    instance.id,
  );

  const reimbursementTypeId =
    instance.overrideReimbursementTypeId ?? instance.master.reimbursementTypeId;

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

        <PauschaleMarker
          reimbursementTypeId={reimbursementTypeId}
          className="self-start"
        />

        {instance.master.visibility === ShiftVisibility.InvitedMembers && (
          <span className="flex w-full items-center gap-1 text-sm text-muted-foreground">
            <LockKeyhole className="size-3" />
            {t('visibility.INVITED_MEMBERS')}
          </span>
        )}
      </div>

      <VolunteeringShiftCardVolunteers
        volunteers={invitedVolunteers}
        phase="before"
        sectionLabel={t('card.invited')}
      />
      <VolunteeringShiftCardVolunteers
        volunteers={waitlistVolunteers}
        phase="before"
        sectionLabel={t('card.waitlist')}
      />
    </Card>
  );
}
