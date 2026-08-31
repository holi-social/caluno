export const POSTHOG_SURFACE = {
  VOLUNTEERING: 'volunteering',
  BACKOFFICE: 'backoffice',
  PUBLIC: 'public',
  AUTH: 'auth',
} as const;

export type PostHogSurface =
  (typeof POSTHOG_SURFACE)[keyof typeof POSTHOG_SURFACE];

export const POSTHOG_JOIN_SOURCE = {
  SELF_JOIN: 'self_join',
  MEMBERSHIP_APPROVE: 'membership_approve',
  INVITE_ACCEPT: 'invite_accept',
} as const;

export type PostHogJoinSource =
  (typeof POSTHOG_JOIN_SOURCE)[keyof typeof POSTHOG_JOIN_SOURCE];

export const POSTHOG_OBJECTS = [
  'user',
  'user_profile',
  'organization',
  'organization_unit',
  'membership',
  'membership_request',
  'role',
  'shift',
  'shift_instance',
  'shift_invite',
  'shift_instance_invite',
  'event',
  'event_invite',
  'time_entry',
  'requirement_profile',
  'requirement',
  'requirement_form',
  'form_block',
  'form_block_field',
  'form_submission',
  'requirement_fulfillment',
  'requirement_profile_submission',
  'required_form',
  'contract',
  'invoice',
  'document_template',
  'reimbursement_rate',
  'file',
  'otp',
  'password_reset',
] as const;

export type PostHogObject = (typeof POSTHOG_OBJECTS)[number];

export const POSTHOG_ACTIONS = [
  'sign_up',
  'log_in',
  'log_out',
  'create',
  'update',
  'delete',
  'join',
  'leave',
  'invite',
  'reject',
  'cancel',
  'submit',
  'approve',
  'start',
  'end',
  'check_in',
  'check_out',
  'sign',
  'decline',
  'send',
  'upload',
] as const;

export type PostHogAction = (typeof POSTHOG_ACTIONS)[number];

export type PostHogCaptureProperties = {
  surface: PostHogSurface;
  organization_id?: string;
  organization_unit_id?: string;
  source?: string;
  [key: string]: string | number | boolean | undefined;
};

type PostHogEventDefinition<Name extends string> = {
  name: Name;
  description: string;
};

function defineEvent<Name extends string>(
  name: Name,
  description: string,
): PostHogEventDefinition<Name> {
  return { name, description };
}

export const POSTHOG_EVENT_REGISTRY = {
  user_sign_up: defineEvent('user_sign_up', 'A user account is created.'),
  user_log_in: defineEvent('user_log_in', 'A user session is created.'),
  user_log_out: defineEvent('user_log_out', 'A user session is deleted.'),
  user_update: defineEvent(
    'user_update',
    'A user account field is updated (locale or image).',
  ),
  user_profile_update: defineEvent(
    'user_profile_update',
    'A user profile is created or updated.',
  ),
  otp_send: defineEvent('otp_send', 'An email OTP is sent.'),
  password_reset_send: defineEvent(
    'password_reset_send',
    'A password-reset email is sent.',
  ),
  organization_create: defineEvent(
    'organization_create',
    'An organization is created.',
  ),
  organization_join: defineEvent(
    'organization_join',
    'A user becomes a member of an organization for the first time.',
  ),
  organization_unit_create: defineEvent(
    'organization_unit_create',
    'An organization unit is created.',
  ),
  organization_unit_update: defineEvent(
    'organization_unit_update',
    'An organization unit is updated.',
  ),
  organization_unit_delete: defineEvent(
    'organization_unit_delete',
    'An organization unit is deleted.',
  ),
  organization_unit_join: defineEvent(
    'organization_unit_join',
    'A volunteer becomes a member of an organization unit.',
  ),
  organization_unit_leave: defineEvent(
    'organization_unit_leave',
    'A volunteer leaves an organization unit.',
  ),
  role_create: defineEvent('role_create', 'A role is created.'),
  role_update: defineEvent('role_update', 'A role is updated.'),
  role_delete: defineEvent('role_delete', 'A role is deleted.'),
  membership_update: defineEvent(
    'membership_update',
    'Membership roles are updated.',
  ),
  membership_request_submit: defineEvent(
    'membership_request_submit',
    'A membership request is submitted.',
  ),
  membership_request_start: defineEvent(
    'membership_request_start',
    'A volunteer starts joining but is blocked on requirements.',
  ),
  membership_request_reject: defineEvent(
    'membership_request_reject',
    'A membership request is rejected.',
  ),
  membership_request_approve: defineEvent(
    'membership_request_approve',
    'A membership request is approved.',
  ),
  membership_request_cancel: defineEvent(
    'membership_request_cancel',
    'A membership request is cancelled by the volunteer.',
  ),
  membership_request_delete: defineEvent(
    'membership_request_delete',
    'A membership request is deleted.',
  ),
  shift_create: defineEvent('shift_create', 'A shift is created.'),
  shift_update: defineEvent('shift_update', 'A shift is updated.'),
  shift_delete: defineEvent('shift_delete', 'A shift is deleted.'),
  shift_join: defineEvent(
    'shift_join',
    'A volunteer joins a shift (all instances).',
  ),
  shift_instance_update: defineEvent(
    'shift_instance_update',
    'A shift instance is updated.',
  ),
  shift_instance_delete: defineEvent(
    'shift_instance_delete',
    'A shift instance is deleted.',
  ),
  shift_instance_cancel: defineEvent(
    'shift_instance_cancel',
    'A shift instance is cancelled.',
  ),
  shift_instance_invite: defineEvent(
    'shift_instance_invite',
    'Volunteers are invited to a shift instance.',
  ),
  shift_instance_join: defineEvent(
    'shift_instance_join',
    'A volunteer becomes a participant of a shift instance.',
  ),
  shift_instance_check_in: defineEvent(
    'shift_instance_check_in',
    'A volunteer checks in to a shift instance.',
  ),
  shift_instance_check_out: defineEvent(
    'shift_instance_check_out',
    'A volunteer checks out of a shift instance.',
  ),
  shift_invite_update: defineEvent(
    'shift_invite_update',
    'A shift invite status is updated.',
  ),
  shift_instance_invite_update: defineEvent(
    'shift_instance_invite_update',
    'A shift instance invite status is updated.',
  ),
  event_create: defineEvent(
    'event_create',
    'A product Event (one-off happening) is created.',
  ),
  event_update: defineEvent(
    'event_update',
    'A product Event (one-off happening) is updated.',
  ),
  event_delete: defineEvent(
    'event_delete',
    'A product Event (one-off happening) is deleted.',
  ),
  event_cancel: defineEvent(
    'event_cancel',
    'A product Event (one-off happening) is cancelled.',
  ),
  event_invite: defineEvent(
    'event_invite',
    'Volunteers are invited to a product Event.',
  ),
  event_join: defineEvent(
    'event_join',
    'A volunteer becomes a participant of a product Event.',
  ),
  event_invite_update: defineEvent(
    'event_invite_update',
    'An event invite status is updated.',
  ),
  time_entry_create: defineEvent(
    'time_entry_create',
    'A time entry is created by an admin.',
  ),
  time_entry_end: defineEvent(
    'time_entry_end',
    'A time entry is closed by an admin.',
  ),
  time_entry_update: defineEvent(
    'time_entry_update',
    'A time entry is updated.',
  ),
  time_entry_delete: defineEvent(
    'time_entry_delete',
    'A time entry is deleted.',
  ),
  required_form_update: defineEvent(
    'required_form_update',
    'Required forms are set on a target.',
  ),
  requirement_profile_create: defineEvent(
    'requirement_profile_create',
    'A requirement profile is created.',
  ),
  requirement_profile_update: defineEvent(
    'requirement_profile_update',
    'A requirement profile is updated.',
  ),
  requirement_profile_delete: defineEvent(
    'requirement_profile_delete',
    'A requirement profile is deleted.',
  ),
  requirement_create: defineEvent(
    'requirement_create',
    'A requirement is created.',
  ),
  requirement_update: defineEvent(
    'requirement_update',
    'A requirement is updated.',
  ),
  requirement_delete: defineEvent(
    'requirement_delete',
    'A requirement is deleted.',
  ),
  requirement_form_create: defineEvent(
    'requirement_form_create',
    'A requirement form is created.',
  ),
  requirement_form_update: defineEvent(
    'requirement_form_update',
    'A requirement form is updated.',
  ),
  requirement_form_delete: defineEvent(
    'requirement_form_delete',
    'A requirement form is deleted.',
  ),
  form_block_create: defineEvent(
    'form_block_create',
    'A form block is created.',
  ),
  form_block_update: defineEvent(
    'form_block_update',
    'A form block is updated.',
  ),
  form_block_delete: defineEvent(
    'form_block_delete',
    'A form block is deleted.',
  ),
  form_block_field_create: defineEvent(
    'form_block_field_create',
    'A form block field is created.',
  ),
  form_block_field_update: defineEvent(
    'form_block_field_update',
    'A form block field is updated.',
  ),
  form_block_field_delete: defineEvent(
    'form_block_field_delete',
    'A form block field is deleted.',
  ),
  form_submission_submit: defineEvent(
    'form_submission_submit',
    'A form submission is submitted.',
  ),
  form_submission_reject: defineEvent(
    'form_submission_reject',
    'Form submissions are rejected.',
  ),
  requirement_profile_submission_create: defineEvent(
    'requirement_profile_submission_create',
    'A requirement profile submission is created.',
  ),
  requirement_profile_submission_update: defineEvent(
    'requirement_profile_submission_update',
    'A requirement profile submission is updated.',
  ),
  requirement_profile_submission_delete: defineEvent(
    'requirement_profile_submission_delete',
    'A requirement profile submission is deleted.',
  ),
  requirement_fulfillment_update: defineEvent(
    'requirement_fulfillment_update',
    'A requirement fulfillment is updated.',
  ),
  requirement_fulfillment_delete: defineEvent(
    'requirement_fulfillment_delete',
    'A requirement fulfillment is deleted.',
  ),
  invoice_create: defineEvent('invoice_create', 'An invoice is created.'),
  invoice_sign: defineEvent('invoice_sign', 'An invoice is signed.'),
  invoice_decline: defineEvent('invoice_decline', 'An invoice is declined.'),
  contract_create: defineEvent('contract_create', 'A contract is created.'),
  contract_sign: defineEvent('contract_sign', 'A contract is signed.'),
  contract_decline: defineEvent('contract_decline', 'A contract is declined.'),
  document_template_create: defineEvent(
    'document_template_create',
    'A document template is created.',
  ),
  document_template_update: defineEvent(
    'document_template_update',
    'A document template is updated.',
  ),
  document_template_delete: defineEvent(
    'document_template_delete',
    'A document template is deleted.',
  ),
  reimbursement_rate_update: defineEvent(
    'reimbursement_rate_update',
    'A reimbursement rate is set.',
  ),
  file_create: defineEvent(
    'file_create',
    'A file row is created pending upload.',
  ),
  file_upload: defineEvent(
    'file_upload',
    'A file upload is completed and verified.',
  ),
} as const;

export type PostHogEventName = keyof typeof POSTHOG_EVENT_REGISTRY;

export const POSTHOG_EVENT = Object.fromEntries(
  (Object.keys(POSTHOG_EVENT_REGISTRY) as PostHogEventName[]).map((name) => [
    name.toUpperCase(),
    name,
  ]),
) as { readonly [K in PostHogEventName as Uppercase<K>]: K };

export const FORBIDDEN_POSTHOG_PROPERTY_KEYS = [
  'email',
  'name',
  'token',
  'otp',
  'password',
  'ip',
  'query',
  'form_answers',
  'answers',
] as const;

const FORBIDDEN_POSTHOG_PROPERTY_KEY_SET = new Set<string>(
  FORBIDDEN_POSTHOG_PROPERTY_KEYS,
);

export function omitForbiddenPostHogProperties(
  properties: PostHogCaptureProperties,
): {
  properties: PostHogCaptureProperties;
  droppedKeys: string[];
} {
  const droppedKeys: string[] = [];
  const cleaned: PostHogCaptureProperties = { surface: properties.surface };
  for (const [key, value] of Object.entries(properties)) {
    if (FORBIDDEN_POSTHOG_PROPERTY_KEY_SET.has(key.toLowerCase())) {
      droppedKeys.push(key);
      continue;
    }
    cleaned[key] = value;
  }
  return { properties: cleaned, droppedKeys };
}
