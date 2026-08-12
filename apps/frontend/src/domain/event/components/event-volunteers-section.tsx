'use client';

import { MembershipRequestStatus } from '@repo/data';
import type { EventInviteItem } from '@repo/data/react';
import {
  Button,
  type VolunteeringActionLabel,
  VolunteeringVolunteerList,
  type VolunteeringVolunteerListItem,
} from '@repo/ui';
import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  countInviteDisplayStates,
  formatInviteStatusSummary,
  toInviteDisplayState,
} from '@/domain/shift/invite-status-display';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { Link, useRouter } from '@/i18n/navigation';
import { inviteEventPath } from '../routes';

interface EventVolunteersSectionProps {
  orgUId: string;
  eventId: string;
  invites: EventInviteItem[];
  canEdit: boolean;
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

  const statusLabel = (status: EventInviteItem['status']) => {
    const state = toInviteDisplayState(status);
    switch (state) {
      case 'invited':
        return tShift('inviteStatus.invited');
      case 'accepted':
        return tShift('inviteStatus.accepted');
      case 'signed_up':
        return tShift('inviteStatus.signedUp');
      case 'declined':
        return tShift('inviteStatus.declined');
      case 'cancelled':
        return tShift('inviteStatus.cancelled');
      case 'rejected':
        return tShift('inviteStatus.rejected');
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
    actions: [],
    iconActions: ['View', 'Check in'],
  }));

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
        Invite: tShift('inviteStatus.actionInvite'),
        Uninvite: tShift('inviteStatus.actionUninvite'),
      }}
      onAction={onAction}
    />
  );
}
