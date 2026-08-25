'use client';

import { type EventInviteStatus, MembershipRequestStatus } from '@repo/data';
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
  adminUninviteTargetStatus,
  canAdminReinvite,
  canAdminUninvite,
  countInviteDisplayStates,
  formatInviteStatusSummary,
  isParticipatingInvite,
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
  invite: EventInviteItem,
  canManage: boolean,
): VolunteeringActionLabel[] {
  if (!canManage) return [];
  if (canAdminUninvite(invite)) return ['Uninvite'];
  if (canAdminReinvite(invite)) return ['Invite'];
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

  const statusLabel = (invite: EventInviteItem) => {
    const state = toInviteDisplayState(invite);
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
    const isParticipating = isParticipatingInvite(invite);

    return {
      id: invite.user.id,
      name: invite.user.name,
      image: invite.user.image,
      state: toInviteDisplayState(invite),
      statusLabel: statusLabel(invite),
      actions: manageActions(invite, canEdit),
      iconActions: isParticipating ? ['View', 'Check in'] : ['View'],
    };
  });

  const counts = countInviteDisplayStates(invites);
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

    if (action === 'Uninvite') {
      const targetStatus = adminUninviteTargetStatus(invite);
      if (targetStatus == null) {
        return;
      }
      startTransition(async () => {
        const result = await updateEventInviteStatus(orgUId, eventId, {
          userId: volunteerId,
          status: targetStatus as unknown as EventInviteStatus,
        });
        if (result?.serverError) {
          toast.error(t('uninviteError'));
          return;
        }
        toast.success(t('uninviteSuccess'));
        router.refresh();
      });
      return;
    }

    if (action === 'Invite') {
      if (!canAdminReinvite(invite)) {
        return;
      }
      startTransition(async () => {
        const result = await updateEventInviteStatus(orgUId, eventId, {
          userId: volunteerId,
          status: null,
        });
        if (result?.serverError) {
          toast.error(t('inviteError'));
          return;
        }
        toast.success(t('inviteSuccess'));
        router.refresh();
      });
    }
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
