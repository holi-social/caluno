'use client';

import { EventInviteStatus, MembershipRequestStatus } from '@repo/data';
import type { EventInviteItem } from '@repo/data/react';
import {
  type VolunteeringActionLabel,
  VolunteeringVolunteerList,
  type VolunteeringVolunteerListItem,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import {
  adminUninviteTargetStatus,
  canAdminUninvite,
  toInviteDisplayState,
} from '@/domain/shift/invite-status-display';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { useRouter } from '@/i18n/navigation';
import { updateEventInviteStatus } from '../actions';

interface EventVolunteersCardProps {
  orgUId: string;
  eventId: string;
  invites: EventInviteItem[];
  canEdit: boolean;
}

function manageActions(
  status: EventInviteStatus,
  canManage: boolean,
): VolunteeringActionLabel[] {
  if (!canManage) return [];
  if (canAdminUninvite(status)) return ['Uninvite'];
  return [];
}

export function EventVolunteersSection({
  orgUId,
  eventId,
  invites,
  canEdit,
}: EventVolunteersCardProps) {
  const t = useTranslations('Event.detail.volunteersCard');
  const tVolunteer = useTranslations('Volunteer.action');
  const router = useRouter();
  const { open: openVolunteerSheet } = useSheetTrigger('volunteer-profile');
  const [pending, startTransition] = useTransition();

  const statusLabel = (status: EventInviteStatus) => {
    const state = toInviteDisplayState(status);
    switch (state) {
      case 'invited':
        return t('status.invited');
      case 'accepted':
        return t('status.accepted');
      case 'signed_up':
        return t('status.signedUp');
      case 'declined':
        return t('status.declined');
      case 'cancelled':
        return t('status.cancelled');
      case 'rejected':
        return t('status.rejected');
      default:
        return state;
    }
  };

  const volunteers: VolunteeringVolunteerListItem[] = invites.map((invite) => {
    const isParticipating =
      invite.status === EventInviteStatus.Accepted ||
      invite.status === EventInviteStatus.SelfJoined;

    return {
      id: invite.user.id,
      name: invite.user.name,
      image: invite.user.image,
      state: toInviteDisplayState(invite.status),
      statusLabel: statusLabel(invite.status),
      actions: manageActions(invite.status, canEdit),
      iconActions: isParticipating ? ['View', 'Check in'] : ['View'],
    };
  });

  const openProfile = (invite: EventInviteItem) => {
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
        `/admin/${orgUId}/check-in/${invite.user.checkInId}/check-in`,
      );
      return;
    }

    if (!canEdit || pending || action !== 'Uninvite') {
      return;
    }

    const targetStatus = adminUninviteTargetStatus(invite.status);
    if (!targetStatus) {
      return;
    }

    startTransition(async () => {
      const result = await updateEventInviteStatus(orgUId, eventId, {
        userId: volunteerId,
        status: targetStatus,
      });
      if (result?.serverError) {
        toast.error(t('uninviteError'));
        return;
      }
      toast.success(t('uninviteSuccess'));
      router.refresh();
    });
  };

  if (invites.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('empty')}</p>;
  }

  return (
    <VolunteeringVolunteerList
      volunteers={volunteers}
      phase="before"
      title={t('title')}
      actionLabels={{
        View: tVolunteer('viewProfileAria'),
        'Check in': t('checkInAria'),
        Uninvite: t('actionUninvite'),
      }}
      onAction={onAction}
    />
  );
}
