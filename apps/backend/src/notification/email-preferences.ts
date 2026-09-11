import { NotificationEvent } from './notification-events';

/**
 * The volunteer email settings a notification can be governed by. Mirrors the
 * three toggles on the volunteer's Account settings screen.
 */
export type EmailPreferenceGroup = 'weeklyUpdate' | 'urgentCalls' | 'platform';

/** The `users` column backing each group's toggle. */
export type EmailPreferenceFlag =
  | 'emailWeeklyUpdateEnabled'
  | 'emailUrgentCallsEnabled'
  | 'emailPlatformEnabled';

export const EMAIL_PREFERENCE_FLAG: Record<
  EmailPreferenceGroup,
  EmailPreferenceFlag
> = {
  weeklyUpdate: 'emailWeeklyUpdateEnabled',
  urgentCalls: 'emailUrgentCallsEnabled',
  platform: 'emailPlatformEnabled',
};

/** Just the preference flags, so any recipient shape can be filtered. */
export type EmailPreferenceFlags = Partial<
  Record<EmailPreferenceFlag, boolean | null>
>;

/**
 * Which volunteer setting governs each notification's *volunteer-facing*
 * email, or `null` when no volunteer setting governs it.
 *
 * `null` is deliberate for two families:
 *
 * - emails addressed to a manager about a volunteer — those name a third party
 *   (`volunteerName` / `requesterName` / `joinedUserId`) and are sent to
 *   somebody acting in a manager role, not to the volunteer the setting
 *   belongs to. The story is explicit: manager emails ignore volunteer
 *   settings.
 * - document/signing emails, which the story does not list under Platform.
 *
 * Typed as a full `Record` so adding an event to `NotificationEvent` without
 * classifying it here is a type error rather than a silent un-gated send.
 */
export const NOTIFICATION_EMAIL_GROUP: Record<
  NotificationEvent,
  EmailPreferenceGroup | null
> = {
  // Platform — things that happened to the volunteer, addressed to them.
  [NotificationEvent.SHIFT_INVITED]: 'platform',
  [NotificationEvent.SHIFT_INSTANCE_INVITED]: 'platform',
  [NotificationEvent.EVENT_INVITED]: 'platform',
  [NotificationEvent.ORGANIZATION_UNIT_INVITED]: 'platform',
  [NotificationEvent.SHIFT_INSTANCE_CANCELLED]: 'platform',
  [NotificationEvent.SHIFT_INSTANCE_SERIES_CANCELLED]: 'platform',
  [NotificationEvent.EVENT_CANCELLED]: 'platform',
  [NotificationEvent.SHIFT_DETAILS_CHANGED]: 'platform',
  [NotificationEvent.EVENT_DETAILS_CHANGED]: 'platform',
  [NotificationEvent.SHIFT_INSTANCE_REMOVED]: 'platform',
  [NotificationEvent.SHIFT_SERIES_REMOVED]: 'platform',
  [NotificationEvent.SHIFT_INSTANCE_LEFT]: 'platform',
  [NotificationEvent.SHIFT_SERIES_LEFT]: 'platform',
  [NotificationEvent.EVENT_REMOVED]: 'platform',
  [NotificationEvent.MEMBERSHIP_APPROVED]: 'platform',
  [NotificationEvent.MEMBERSHIP_REJECTED]: 'platform',
  [NotificationEvent.MEMBERSHIP_REMOVED]: 'platform',

  // Manager-facing — a manager is told what a volunteer did. Never gated.
  [NotificationEvent.SHIFT_INSTANCE_JOINED]: null,
  [NotificationEvent.EVENT_JOINED]: null,
  [NotificationEvent.SHIFT_INSTANCE_VOLUNTEER_LEFT]: null,
  [NotificationEvent.SHIFT_SERIES_VOLUNTEER_LEFT]: null,
  [NotificationEvent.MEMBERSHIP_REQUESTED]: null,
  [NotificationEvent.MEMBERSHIP_LEFT]: null,
  [NotificationEvent.ORGANIZATION_CREATED]: null,

  // Documents are out of scope for the Platform toggle.
  [NotificationEvent.DOCUMENT_AWAITING_SIGNATURE]: null,
  [NotificationEvent.DOCUMENT_DECLINED_BY_ORG]: null,
  [NotificationEvent.DOCUMENT_DECLINED_BY_VOLUNTEER]: null,

  // The call-out and digest are sent directly by their own senders rather than
  // through the emitter; the entries below are the groups those senders
  // enforce. Only the volunteer-facing call-out is gated — the "nobody left to
  // ask" and "here's what happened" mails go to the requesting manager, and
  // the understaffed reminder goes to managers too.
  [NotificationEvent.SHIFT_INSTANCE_CALL_OUT]: 'urgentCalls',
  [NotificationEvent.SHIFT_INSTANCE_CALL_OUT_NO_RECIPIENTS]: null,
  [NotificationEvent.SHIFT_INSTANCE_CALL_OUT_SUMMARY]: null,
  [NotificationEvent.SHIFT_INSTANCE_UNDERSTAFFED_REMINDER]: null,
  [NotificationEvent.VOLUNTEER_DIGEST_SENT]: 'weeklyUpdate',
};

/**
 * Whether a recipient still wants the emails governed by `group`.
 *
 * Only an explicit `false` opts out: rows that predate the setting (and test
 * fixtures that don't carry it) count as subscribed, which matches the "all
 * three default to on" rule.
 */
export function isSubscribedToGroup(
  recipient: EmailPreferenceFlags,
  group: EmailPreferenceGroup,
): boolean {
  return recipient[EMAIL_PREFERENCE_FLAG[group]] !== false;
}

/**
 * Drops the recipients who have switched off the setting governing `event`.
 * This is the single place the preference is applied — `NotificationService`
 * delegates here, and so do the senders that mail outside it (the urgent
 * call-out and the weekly digest), so the rule cannot drift between them.
 *
 * Events mapped to `null` — manager-facing email — are never filtered.
 */
export function filterRecipientsForEvent<
  TRecipient extends EmailPreferenceFlags,
>(recipients: TRecipient[], event: NotificationEvent): TRecipient[] {
  const group = NOTIFICATION_EMAIL_GROUP[event];
  if (!group) {
    return recipients;
  }

  return recipients.filter((recipient) =>
    isSubscribedToGroup(recipient, group),
  );
}
