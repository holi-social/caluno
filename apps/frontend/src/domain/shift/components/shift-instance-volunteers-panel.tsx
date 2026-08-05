'use client';

import { MembershipRequestStatus, type ShiftInviteStatus } from '@repo/data';
import {
  type VolunteeringActionLabel,
  VolunteeringVolunteerList,
  type VolunteeringVolunteerListItem,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { useRouter } from '@/i18n/navigation';
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

type InstanceInvite = {
  status: ShiftInviteStatus;
  user: {
    id: string;
    name: string;
    email?: string | null;
    image?: string | null;
  };
};

type ShiftInstanceVolunteersPanelProps = {
  orgUId: string;
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
    actions: [...manageActions(invite.status, canManage), 'View'],
  }));

  const counts = countInviteDisplayStates(invites.map((i) => i.status));
  const summary = formatInviteStatusSummary(counts, spotsLeft, {
    invited: t('inviteStatus.summaryInvited'),
    accepted: t('inviteStatus.summaryAccepted'),
    signedUp: t('inviteStatus.summarySignedUp'),
    spots: t('inviteStatus.summarySpots'),
  });

  const openProfile = (volunteerId: string) => {
    const invite = invites.find((item) => item.user.id === volunteerId);
    if (!invite) {
      return;
    }

    openVolunteerSheet({
      userId: invite.user.id,
      volunteerName: invite.user.name,
      volunteerStatus: MembershipRequestStatus.Accepted,
      volunteerEmail: invite.user.email ?? '',
      volunteerCheckInId: '',
    });
  };

  const onAction = (volunteerId: string, action: VolunteeringActionLabel) => {
    if (action === 'View') {
      openProfile(volunteerId);
      return;
    }

    if (!canManage || pending) {
      return;
    }

    const invite = invites.find((item) => item.user.id === volunteerId);
    if (!invite) {
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
      actionLabels={{
        View: tVolunteer('viewProfileAria'),
        Invite: t('inviteStatus.actionInvite'),
        Uninvite: t('inviteStatus.actionUninvite'),
      }}
      onAction={onAction}
    />
  );
}
