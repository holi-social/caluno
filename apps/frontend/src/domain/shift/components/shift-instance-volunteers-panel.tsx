'use client';

import { MembershipRequestStatus, type ShiftInviteStatus } from '@repo/data';
import {
  Button,
  type VolunteeringActionLabel,
  VolunteeringVolunteerList,
  type VolunteeringVolunteerListItem,
} from '@repo/ui';
import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { Link, useRouter } from '@/i18n/navigation';
import { updateShiftInstanceInviteStatus } from '../actions';
import {
  adminReinviteTargetStatus,
  adminUninviteTargetStatus,
  canAdminReinvite,
  canAdminUninvite,
  countInviteDisplayStates,
  formatInviteStatusSummary,
  toInviteDisplayState,
} from '../invite-status-display';
import { shiftInvitePath } from '../routes';

type InstanceInvite = {
  status: ShiftInviteStatus;
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
  canManage: boolean;
};

function manageActions(
  status: ShiftInviteStatus,
  canManage: boolean,
): VolunteeringActionLabel[] {
  if (!canManage) return [];
  if (canAdminUninvite(status)) return ['Uninvite'];
  if (canAdminReinvite(status)) return ['Invite'];
  return [];
}

export function ShiftInstanceVolunteersPanel({
  orgUId,
  shiftId,
  instanceId,
  invites,
  spotsLeft,
  canManage,
}: ShiftInstanceVolunteersPanelProps) {
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
      default:
        return state;
    }
  };

  const volunteers: VolunteeringVolunteerListItem[] = invites.map((invite) => ({
    id: invite.user.id,
    name: invite.user.name,
    image: invite.user.image,
    state: toInviteDisplayState(invite.status),
    statusLabel: statusLabel(invite.status),
    actions: manageActions(invite.status, canManage),
    iconActions: ['View', 'Check in'],
  }));

  const counts = countInviteDisplayStates(invites.map((i) => i.status));
  const summary = formatInviteStatusSummary(counts, spotsLeft, {
    invited: t('inviteStatus.summaryInvited'),
    accepted: t('inviteStatus.summaryAccepted'),
    signedUp: t('inviteStatus.summarySignedUp'),
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

    if (!canManage || pending) {
      return;
    }

    const targetStatus =
      action === 'Uninvite'
        ? adminUninviteTargetStatus(invite.status)
        : action === 'Invite'
          ? adminReinviteTargetStatus(invite.status)
          : null;
    if (!targetStatus) {
      return;
    }

    startTransition(async () => {
      const result = await updateShiftInstanceInviteStatus(orgUId, instanceId, {
        userId: volunteerId,
        status: targetStatus,
      });
      if (result?.serverError) {
        toast.error(
          action === 'Invite'
            ? t('inviteStatus.inviteError')
            : t('inviteStatus.uninviteError'),
        );
        return;
      }
      toast.success(
        action === 'Invite'
          ? t('inviteStatus.inviteSuccess')
          : t('inviteStatus.uninviteSuccess'),
      );
      router.refresh();
    });
  };

  return (
    <VolunteeringVolunteerList
      volunteers={volunteers}
      phase="before"
      title={t('inviteStatus.volunteersTitle')}
      summary={summary}
      headerAction={
        canManage ? (
          <Button asChild size="sm">
            <Link href={shiftInvitePath(orgUId, shiftId, instanceId)}>
              <UserPlus />
              {t('instanceDetail.inviteCta')}
            </Link>
          </Button>
        ) : undefined
      }
      actionLabels={{
        View: tVolunteer('viewProfileAria'),
        'Check in': tVolunteer('checkInAria'),
        Invite: t('inviteStatus.actionInvite'),
        Uninvite: t('inviteStatus.actionUninvite'),
      }}
      onAction={onAction}
    />
  );
}
