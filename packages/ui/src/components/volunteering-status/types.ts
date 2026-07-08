/** Which part of the shift timeline drives the volunteer row presentation. */
export type ShiftVolunteeringPhase = 'before' | 'during' | 'after';

/**
 * Display states for a volunteer on a shift instance detail page.
 * Combines invite/join status with check-in and post-shift inference.
 */
export type ShiftVolunteeringDisplayState =
  | 'invited'
  | 'requested'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'checked_in'
  | 'not_checked_in'
  | 'completed'
  | 'no_show'
  | 'invited_never_responded'
  | 'requested_never_responded';

/** Semantic icon color — the primary status signal across the app. */
export type VolunteeringStatusIconTone =
  | 'neutral'
  | 'positive'
  | 'warning'
  | 'destructive';

export type VolunteeringActionLabel =
  | 'Accept'
  | 'Decline'
  | 'Uninvite'
  | 'Check in'
  | 'Check out'
  | 'Add timesheet'
  | 'Edit time';

export type VolunteeringStatusPresentation = {
  iconTone: VolunteeringStatusIconTone;
  label: string;
  actions: VolunteeringActionLabel[];
  /** Shown only on lifecycle reference panels when every state has copy. */
  description: string;
};
