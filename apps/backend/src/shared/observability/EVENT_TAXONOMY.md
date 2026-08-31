# PostHog event taxonomy

Runtime source of truth: `posthog.events.ts`. Domain code never imports `posthog-node` and never passes a free-string event name. Standing invariant: `apps/backend/AGENTS.md` (Observability / PostHog).

## What we track

Successful backend writes (GraphQL mutations, Better Auth account/session callbacks, file upload persist). One capture per successful action. Distinct ID is the daily HMAC of the **subject** user id (`userId:YYYY-MM-DD` Europe/Berlin).

## What we do not track

- Page views, screen views, clicks, hovers, scroll
- GraphQL queries / field resolvers / DataLoaders / permission checks
- Health, codegen, Sentry
- File downloads
- PII: email, name, form answers, tokens, raw search text, IP
- Dynamic event names (`shift_join_${id}`)

## Event name

```
{object}_{action}
```

- snake_case, lowercase, ASCII
- **object** = a GLOSSARY noun, full word (`organization`, not `org`)
- **action** = a present-tense verb from the closed list below
- No product prefix (`caluno_`), no UI chrome (`_click`, `_button`)
- No category colon prefix (`membership:`)
- No dynamic segments
- The person is the `distinctId`. Only auth uses `user` as the object.

Say it out loud: “an [object] was [action]ed.” If you cannot, the name is wrong — put the extra meaning in a property.

### Auth exception

- `user_sign_up`
- `user_log_in`
- `user_log_out`
- `user_update`

### Product Event vs PostHog event

GLOSSARY **Event** (one-off happening) keeps the object name `event`. `event_join` is an analytics event about a product Event. `event_description` on the payload disambiguates.

### Object list (closed)

Add a noun here before inventing an event.

| Object | Notes |
|---|---|
| `user` | User (auth only) |
| `user_profile` | User Profile |
| `organization` | Organization |
| `organization_unit` | Organization Unit |
| `membership` | Membership |
| `membership_request` | Membership Request |
| `role` | Role |
| `shift` | Shift |
| `shift_instance` | Shift Instance |
| `shift_invite` | Shift Invite |
| `shift_instance_invite` | Shift Instance Invite |
| `event` | Event |
| `event_invite` | Event Invite |
| `time_entry` | Time Entry |
| `requirement_profile` | Requirement Profile |
| `requirement` | Requirement |
| `requirement_form` | Requirement Form |
| `form_block` | Form Block |
| `form_block_field` | Form Block Field |
| `form_submission` | Form Submission |
| `requirement_fulfillment` | Requirement Fulfillment |
| `requirement_profile_submission` | Requirement Profile Submission |
| `required_form` | Required form assignment |
| `contract` | Accounting |
| `invoice` | Accounting |
| `document_template` | Accounting |
| `reimbursement_rate` | Accounting |
| `file` | Storage |
| `otp` | Auth OTP |
| `password_reset` | Auth password-reset email |

Compound objects stay compound: `shift_instance_join` ≠ `shift_join`.

### Action list (closed)

Present tense. Add a verb here before using it in a name.

| Action | Use for |
|---|---|
| `sign_up` | account created |
| `log_in` | session created |
| `log_out` | session deleted |
| `create` | new entity persisted |
| `update` | existing entity changed |
| `delete` | entity removed / soft-deleted |
| `join` | volunteer becomes a participant |
| `leave` | volunteer stops being a participant |
| `invite` | admin sends an invite |
| `reject` | invite/request rejected |
| `cancel` | invite, request, or instance cancelled |
| `submit` | form / request submitted |
| `approve` | admin approves a request |
| `start` | request blocked on requirements, or time entry opened |
| `end` | time entry closed (manual) |
| `check_in` | QR/admin check-in |
| `check_out` | QR/admin check-out |
| `sign` | contract/invoice signed |
| `decline` | contract/invoice declined |
| `send` | OTP / password-reset email dispatched |
| `upload` | file bytes confirmed on object storage |

Do not use `click` or `view`.

### How vs what

If two mutations produce the same outcome, they share one event. Difference goes in `source` (or `invite_status`), not in the name.

## Properties

Every capture uses this envelope. Extra object ids are allowed; extra PII is not.

```ts
{
  event_description: string; // from the registry; callers must not set this
  surface: 'volunteering' | 'backoffice' | 'public' | 'auth';
  organization_id?: string;
  organization_unit_id?: string;
  source?: string;
  // object ids: shift_id, shift_instance_id, event_id, …
}
```

- snake_case, full glossary words (`organization_id`, not `org_id`, not `organizationId`)
- booleans: `is_` / `has_`
- dates: `_date` or `_timestamp`
- no email, name, form field values, tokens, raw query text
- org-scoped events set PostHog group `organization` = `organization_id`
- `distinctId` is the **subject** of the action (usually the volunteer), not necessarily the admin who clicked

## Capture site

Domain service, after the write commits. Not GraphQL resolvers. Not `@OnEvent` notification listeners. If two callers hit the same service method, capture once inside that method; distinguish with `source`.

Capture is fire-and-forget. Missing `POSTHOG_API_KEY` / `POSTHOG_DISTINCT_SECRET` is a no-op.
