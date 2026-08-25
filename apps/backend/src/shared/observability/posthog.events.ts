export const POSTHOG_EVENT = {
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_JOINED_ORG: 'user_joined_org',
} as const;

export type PostHogEventName =
  (typeof POSTHOG_EVENT)[keyof typeof POSTHOG_EVENT];

export type UserJoinedOrgSource =
  | 'membership_approved'
  | 'organization_created';

export type UserJoinedOrgCaptureInput = {
  organizationId: string;
  organizationUnitId: string;
  source: UserJoinedOrgSource;
};
