'use client';

import { MembershipRequestStatus, ShiftInviteStatus } from '@repo/data';
import {
  Badge,
  Button,
  type VolunteeringActionLabel,
  VolunteeringVolunteerList,
  type VolunteeringVolunteerListItem,
} from '@repo/ui';
import { Megaphone, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { Link, useRouter } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import {
  remindShiftInstanceInvite,
  updateShiftInstanceInviteStatus,
} from '../actions';
import {
  adminChipTargetStatuses,
  adminRowActions,
  canRemindInvitee,
  countInviteDisplayStates,
  formatInviteStatusSummary,
  toInviteDisplayState,
} from '../invite-status-display';
import { shiftInvitePath } from '../routes';
import { SendCallOutDialog } from './send-call-out-dialog';

type InstanceInvite = {
  status: ShiftInviteStatus;
  remindedAt?: string | null;
  user: {
    id: string;
    name: string;
    email?: string | null;
    image?: string | null;
    checkInId: string;
  };
};

type ShiftInstanceVolunteersPanelProps = {
  orgUId: string;
  shiftId: string;
  instanceId: string;
  invites: InstanceInvite[];
  spotsLeft: number | null | undefined;
  filledCount: number;
  maxVolunteers: number | null | undefined;
  canManage: boolean;
  isInstanceInThePast: boolean;
};

export function ShiftInstanceVolunteersPanel({
  orgUId,
  shiftId,
  instanceId,
  invites,
  spotsLeft,
  filledCount,
  maxVolunteers,
  canManage,
  isInstanceInThePast,
}: ShiftInstanceVolunteersPanelProps) {
  const { formatDate, formatTime } = useFormatting();
  const t = useTranslations('Shift');
  const tVolunteer = useTranslations('Volunteer.action');
  const router = useRouter();
  const { open: openVolunteerSheet } = useSheetTrigger('volunteer-profile');
  const [pending, startTransition] = useTransition();

  const statusLabel = (status: ShiftInviteStatus) => {
    const state = toInviteDisplayState(status);
    switch (state) {
      case 'invited':
        return t('inviteStatus.invited');
      case 'accepted':
        return t('inviteStatus.accepted');
      case 'signed_up':
        return t('inviteStatus.signedUp');
      case 'declined':
        return t('inviteStatus.declined');
      case 'cancelled':
        return t('inviteStatus.cancelled');
      case 'rejected':
        return t('inviteStatus.rejected');
      case 'requested':
        return t('inviteStatus.pendingApproval');
      case 'waitlisted':
        return t('inviteStatus.waitlisted');
      default:
        return state;
    }
  };

  const chipOptionLabel = (target: ShiftInviteStatus) => {
    switch (target) {
      case ShiftInviteStatus.Joined:
        return t('inviteStatus.accepted');
      case ShiftInviteStatus.AdminRejected:
        return t('inviteStatus.rejected');
      case ShiftInviteStatus.AdminInvited:
        return t('inviteStatus.invited');
      default:
        return target;
    }
  };

  const volunteers: VolunteeringVolunteerListItem[] = invites.map((invite) => {
    const remindVisible =
      canManage &&
      !isInstanceInThePast &&
      invite.status === ShiftInviteStatus.AdminInvited;
    const remindActive = canRemindInvitee(invite.status, invite.remindedAt);

    const chipTargets = canManage ? adminChipTargetStatuses(invite.status) : [];
    const rowActions = canManage ? adminRowActions(invite.status) : [];

    return {
      id: invite.user.id,
      name: invite.user.name,
      image: invite.user.image,
      state: toInviteDisplayState(invite.status),
      statusLabel: statusLabel(invite.status),
      statusOptions:
        chipTargets.length > 0
          ? chipTargets.map((target) => ({
              value: target,
              label: chipOptionLabel(target),
            }))
          : undefined,
      statusMenuAriaLabel: t('inviteStatus.changeStatusAria'),
      actions: remindVisible ? ['Remind', ...rowActions] : rowActions,
      disabledActions: remindVisible && !remindActive ? ['Remind'] : undefined,
      actionLabels: remindVisible
        ? {
            Remind: remindActive
              ? t('inviteStatus.actionRemind')
              : t('inviteStatus.actionReminded'),
          }
        : undefined,
      actionTooltips:
        remindVisible && invite.remindedAt
          ? {
              Remind: t('inviteStatus.remindedAtTooltip', {
                when: `${formatDate(new Date(invite.remindedAt), {
                  month: 'short',
                  day: 'numeric',
                })}, ${formatTime(new Date(invite.remindedAt))}`,
              }),
            }
          : undefined,
      iconActions: ['View', 'Check in'],
    };
  });

  const counts = countInviteDisplayStates(invites.map((i) => i.status));
  const summary = formatInviteStatusSummary(counts, spotsLeft, {
    invited: t('inviteStatus.summaryInvited'),
    accepted: t('inviteStatus.summaryAccepted'),
    signedUp: t('inviteStatus.summarySignedUp'),
    waitlisted: t('inviteStatus.summaryWaitlisted'),
    spots: t('inviteStatus.summarySpots'),
  });

  const openProfile = (invite: InstanceInvite) => {
    openVolunteerSheet({
      userId: invite.user.id,
      volunteerName: invite.user.name,
      volunteerStatus: MembershipRequestStatus.Accepted,
      volunteerEmail: invite.user.email ?? '',
      volunteerCheckInId: invite.user.checkInId,
    });
  };

  const applyStatus = (invite: InstanceInvite, target: ShiftInviteStatus) => {
    if (!canManage || pending) {
      return;
    }

    startTransition(async () => {
      const result = await updateShiftInstanceInviteStatus(orgUId, instanceId, {
        userId: invite.user.id,
        status: target,
      });
      if (result?.serverError) {
        toast.error(t('inviteStatus.statusChangeError'));
        return;
      }

      if (
        target === ShiftInviteStatus.Joined &&
        result?.data?.status === ShiftInviteStatus.WaitlistJoined
      ) {
        toast.success(t('inviteStatus.approveWaitlistedSuccess'));
      } else if (target === ShiftInviteStatus.Joined) {
        toast.success(t('inviteStatus.approveSuccess'));
      } else if (target === ShiftInviteStatus.AdminInvited) {
        toast.success(t('inviteStatus.inviteSuccess'));
      } else if (target === ShiftInviteStatus.AdminRejected) {
        toast.success(t('inviteStatus.declineSuccess'));
      }
      router.refresh();
    });
  };

  const onAction = (volunteerId: string, action: VolunteeringActionLabel) => {
    const invite = invites.find((item) => item.user.id === volunteerId);
    if (!invite) {
      return;
    }

    if (action === 'View') {
      openProfile(invite);
      return;
    }

    if (action === 'Check in') {
      router.push(
        `/check-in/${invite.user.checkInId}/check-in?orgUId=${orgUId}`,
      );
      return;
    }

    if (action === 'Approve') {
      applyStatus(invite, ShiftInviteStatus.Joined);
      return;
    }

    if (action === 'Remind') {
      if (!canManage || pending) {
        return;
      }
      if (!canRemindInvitee(invite.status, invite.remindedAt)) {
        return;
      }
      startTransition(async () => {
        const result = await remindShiftInstanceInvite(orgUId, instanceId, {
          userId: volunteerId,
        });
        if (result?.serverError) {
          toast.error(t('inviteStatus.remindError'));
          return;
        }
        toast.success(t('inviteStatus.remindSuccess'));
        router.refresh();
      });
      return;
    }

    if (action === 'Invite') {
      applyStatus(invite, ShiftInviteStatus.AdminInvited);
    }
  };

  const onStatusChange = (volunteerId: string, value: string) => {
    const invite = invites.find((item) => item.user.id === volunteerId);
    if (!invite) {
      return;
    }
    applyStatus(invite, value as ShiftInviteStatus);
  };

  return (
    <VolunteeringVolunteerList
      volunteers={volunteers}
      phase="before"
      title={t('inviteStatus.volunteersTitle')}
      summary={summary}
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {maxVolunteers != null
              ? t('inviteStatus.capacityBadge', {
                  filled: filledCount,
                  max: maxVolunteers,
                })
              : t('inviteStatus.capacityBadgeNoMax', {
                  filled: filledCount,
                })}
          </Badge>
          {canManage ? (
            <>
              {!isInstanceInThePast ? (
                <SendCallOutDialog
                  orgUId={orgUId}
                  instanceId={instanceId}
                  trigger={
                    <Button variant="outline" size="md">
                      <Megaphone />
                      {t('instanceDetail.callOutCta')}
                    </Button>
                  }
                />
              ) : null}
              <Button asChild size="sm">
                <Link href={shiftInvitePath(orgUId, shiftId, instanceId)}>
                  <UserPlus />
                  {t('instanceDetail.inviteCta')}
                </Link>
              </Button>
            </>
          ) : null}
        </div>
      }
      actionLabels={{
        View: tVolunteer('viewProfileAria'),
        'Check in': tVolunteer('checkInAria'),
        Invite: t('inviteStatus.actionInvite'),
        Approve: t('inviteStatus.actionApprove'),
        Remind: t('inviteStatus.actionRemind'),
      }}
      onAction={onAction}
      onStatusChange={canManage ? onStatusChange : undefined}
    />
  );
}
