import {
  Ban,
  Check,
  CircleCheck,
  CircleDashed,
  CircleMinus,
  CircleSlash,
  Clock,
  Inbox,
  LogIn,
  LogOut,
  type LucideIcon,
  Timer,
  UserPlus,
  UserRound,
  UserX,
  X,
} from 'lucide-react';

import type {
  ShiftVolunteeringDisplayState,
  ShiftVolunteeringPhase,
  VolunteeringActionLabel,
  VolunteeringStatusIconTone,
  VolunteeringStatusPresentation,
} from './types';

export type VolunteeringStatusLucideIcon = LucideIcon;

export const volunteeringStatusIcons: Record<
  ShiftVolunteeringDisplayState,
  VolunteeringStatusLucideIcon
> = {
  invited: Clock,
  requested: Inbox,
  accepted: Check,
  signed_up: Check,
  declined: CircleSlash,
  rejected: CircleSlash,
  cancelled: CircleMinus,
  checked_in: CircleCheck,
  not_checked_in: CircleDashed,
  completed: Timer,
  no_show: UserX,
  invited_never_responded: Clock,
  requested_never_responded: Inbox,
};

/** Icon color is the strongest status signal; badge chrome stays neutral. */
export const volunteeringStatusIconTone: Record<
  ShiftVolunteeringDisplayState,
  VolunteeringStatusIconTone
> = {
  invited: 'neutral',
  requested: 'neutral',
  accepted: 'positive',
  signed_up: 'positive',
  declined: 'neutral',
  rejected: 'destructive',
  cancelled: 'warning',
  checked_in: 'positive',
  not_checked_in: 'warning',
  completed: 'positive',
  no_show: 'warning',
  invited_never_responded: 'neutral',
  requested_never_responded: 'neutral',
};

const REQUESTED_STATES = new Set<ShiftVolunteeringDisplayState>([
  'requested',
  'requested_never_responded',
]);

export function isRequestedVolunteeringState(
  state: ShiftVolunteeringDisplayState,
): boolean {
  return REQUESTED_STATES.has(state);
}

export const volunteeringStatusIconClass: Record<
  VolunteeringStatusIconTone,
  string
> = {
  neutral: 'text-muted-foreground',
  positive: 'text-success',
  warning: 'text-alert',
  destructive: 'text-destructive',
};

export type PresentationOptions = {
  completedDuration?: string;
  phase?: ShiftVolunteeringPhase;
};

/** Lifecycle reference copy — short, plain language for coordinators. */
export const volunteeringLifecycleDescriptions: Record<
  ShiftVolunteeringDisplayState,
  string
> = {
  invited: 'Waiting for their reply.',
  requested: 'Accept or decline to add them.',
  accepted: 'Accepted your invite.',
  signed_up: 'Joined without an invite.',
  declined: 'Not joining this shift.',
  rejected: 'Removed by coordinator.',
  cancelled: 'No longer joining this shift.',
  checked_in: 'Here — time is tracking.',
  not_checked_in: 'Expected but not here yet.',
  completed: 'Volunteer time recorded.',
  no_show: "Didn't check in.",
  invited_never_responded: 'No reply before shift ended.',
  requested_never_responded: "You didn't review in time.",
};

/** Tooltip when a row has no actions during an active shift. */
export const passiveDuringShiftHints: Partial<
  Record<ShiftVolunteeringDisplayState, string>
> = {
  invited: 'Not in check-in — awaiting reply.',
  requested: 'Not in check-in — needs your decision.',
  declined: 'Not on this shift.',
  rejected: 'Not on this shift.',
  cancelled: 'Invite no longer active.',
};

export function getPassiveDuringShiftHint(
  state: ShiftVolunteeringDisplayState,
): string | undefined {
  return passiveDuringShiftHints[state];
}

export function getVolunteeringStatusPresentation(
  state: ShiftVolunteeringDisplayState,
  options: PresentationOptions = {},
): VolunteeringStatusPresentation {
  const { completedDuration, phase } = options;

  switch (state) {
    case 'invited':
      return {
        iconTone: volunteeringStatusIconTone.invited,
        label: 'Invited',
        description: volunteeringLifecycleDescriptions.invited,
        actions: phase === 'after' ? ['Add timesheet'] : ['Uninvite'],
      };
    case 'requested':
      return {
        iconTone: volunteeringStatusIconTone.requested,
        label: 'Requested',
        description: volunteeringLifecycleDescriptions.requested,
        actions: phase === 'after' ? ['Add timesheet'] : ['Accept', 'Decline'],
      };
    case 'accepted':
      return {
        iconTone: volunteeringStatusIconTone.accepted,
        label: 'Accepted',
        description: volunteeringLifecycleDescriptions.accepted,
        actions: ['Uninvite'],
      };
    case 'signed_up':
      return {
        iconTone: volunteeringStatusIconTone.signed_up,
        label: 'Signed up',
        description: volunteeringLifecycleDescriptions.signed_up,
        actions: ['Uninvite'],
      };
    case 'declined':
      return {
        iconTone: volunteeringStatusIconTone.declined,
        label: 'Declined',
        description: volunteeringLifecycleDescriptions.declined,
        actions: phase === 'after' ? ['Add timesheet'] : [],
      };
    case 'rejected':
      return {
        iconTone: volunteeringStatusIconTone.rejected,
        label: 'Rejected',
        description: volunteeringLifecycleDescriptions.rejected,
        actions: ['Invite'],
      };
    case 'cancelled':
      return {
        iconTone: volunteeringStatusIconTone.cancelled,
        label: 'Canceled',
        description: volunteeringLifecycleDescriptions.cancelled,
        actions: [],
      };
    case 'checked_in':
      return {
        iconTone: volunteeringStatusIconTone.checked_in,
        label: 'Checked in',
        description: volunteeringLifecycleDescriptions.checked_in,
        actions: ['Check out'],
      };
    case 'not_checked_in':
      return {
        iconTone: volunteeringStatusIconTone.not_checked_in,
        label: 'Not here yet',
        description: volunteeringLifecycleDescriptions.not_checked_in,
        actions: ['Check in'],
      };
    case 'completed':
      return {
        iconTone: volunteeringStatusIconTone.completed,
        label: completedDuration ?? 'Completed',
        description: volunteeringLifecycleDescriptions.completed,
        actions: ['Edit time'],
      };
    case 'no_show':
      return {
        iconTone: volunteeringStatusIconTone.no_show,
        label: 'No-show',
        description: volunteeringLifecycleDescriptions.no_show,
        actions: ['Add timesheet'],
      };
    case 'invited_never_responded':
      return {
        iconTone: volunteeringStatusIconTone.invited_never_responded,
        label: 'No reply',
        description: volunteeringLifecycleDescriptions.invited_never_responded,
        actions: ['Add timesheet'],
      };
    case 'requested_never_responded':
      return {
        iconTone: volunteeringStatusIconTone.requested_never_responded,
        label: 'Not reviewed',
        description:
          volunteeringLifecycleDescriptions.requested_never_responded,
        actions: ['Add timesheet'],
      };
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function getVolunteeringStatusAriaLabel(
  state: ShiftVolunteeringDisplayState,
  options: PresentationOptions = {},
): string {
  return getVolunteeringStatusPresentation(state, options).label;
}

export const volunteeringActionIcons: Partial<
  Record<VolunteeringActionLabel, VolunteeringStatusLucideIcon>
> = {
  Accept: Check,
  Decline: X,
  Invite: UserPlus,
  View: UserRound,
  'Check in': LogIn,
  'Check out': LogOut,
  Uninvite: Ban,
};

/** Meets 44px minimum touch target while keeping sm visual scale. */
export const volunteeringActionButtonClass = 'min-h-11';

export type VolunteeringActionButtonStyle = {
  variant: 'default' | 'outline';
  className?: string;
};

/** Check-in/out and Accept use filled buttons; Accept is success green. */
export function getVolunteeringActionButtonStyle(
  actionLabel: VolunteeringActionLabel,
): VolunteeringActionButtonStyle {
  if (
    actionLabel === 'Check in' ||
    actionLabel === 'Check out' ||
    actionLabel === 'Accept'
  ) {
    return {
      variant: 'default',
      className:
        actionLabel === 'Accept'
          ? 'bg-success text-success-foreground hover:bg-success/90'
          : undefined,
    };
  }

  if (actionLabel === 'Decline') {
    return {
      variant: 'outline',
      className:
        'border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive',
    };
  }

  return { variant: 'outline' };
}
