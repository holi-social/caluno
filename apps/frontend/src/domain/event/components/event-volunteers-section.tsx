'use client';

import { EventInviteStatus, MembershipRequestStatus } from '@repo/data';
import type { EventInviteItem } from '@repo/data/react';
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
import {
  adminReinviteTargetStatus,
  adminUninviteTargetStatus,
  canAdminReinvite,
  canAdminUninvite,
  countInviteDisplayStates,
  formatInviteStatusSummary,
  toInviteDisplayState,
} from '@/domain/shift/invite-status-display';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { Link, useRouter } from '@/i18n/navigation';
import { updateEventInviteStatus } from '../actions';
import { inviteEventPath } from '../routes';

interface EventVolunteersSectionProps {
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
  if (canAdminReinvite(status)) return ['Invite'];
  return [];
}

export function EventVolunteersSection({
  orgUId,
  eventId,
  invites,
  canEdit,
}: EventVolunteersSectionProps) {
  const t = useTranslations('Event.detail.volunteersCard');
  const tShift = useTranslations('Shift');
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

  const counts = countInviteDisplayStates(invites.map((i) => i.status));
  const summary = formatInviteStatusSummary(counts, null, {
    invited: tShift('inviteStatus.summaryInvited'),
    accepted: tShift('inviteStatus.summaryAccepted'),
    signedUp: tShift('inviteStatus.summarySignedUp'),
    spots: tShift('inviteStatus.summarySpots'),
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

    if (!canEdit || pending) {
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
      const result = await updateEventInviteStatus(orgUId, eventId, {
        userId: volunteerId,
        status: targetStatus,
      });
      if (result?.serverError) {
        toast.error(
          action === 'Invite' ? t('inviteError') : t('uninviteError'),
        );
        return;
      }
      toast.success(
        action === 'Invite' ? t('inviteSuccess') : t('uninviteSuccess'),
      );
      router.refresh();
    });
  };

  return (
    <VolunteeringVolunteerList
      volunteers={volunteers}
      phase="before"
      title={t('title')}
      summary={summary}
      headerAction={
        canEdit ? (
          <Button asChild size="sm">
            <Link href={inviteEventPath(orgUId, eventId)}>
              <UserPlus />
              {t('inviteButton')}
            </Link>
          </Button>
        ) : undefined
      }
      actionLabels={{
        View: tVolunteer('viewProfileAria'),
        'Check in': tVolunteer('checkInAria'),
        Invite: t('actionInvite'),
        Uninvite: t('actionUninvite'),
      }}
      onAction={onAction}
    />
  );
}
