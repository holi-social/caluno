# VOLI-944 — Membership drill-in: org detail + requirement forms (read-only)

Status: **Approved design (revised 2026-08-05)** · Branch: `944-membership-drill-in` (off `942-integrate-memberships`)

> Revised after a data-model review: completion is sourced from `form_submissions` (not `requirement_profile_submissions`), and requested forms are scoped to **org-unit + events** (shifts have no required-forms support today). See "Two systems" below.

## Summary

A full-screen drill-in page reached by tapping an **accepted** membership card on the profile (S1). It shows the membership's status, the volunteer's role (view-only), when they joined, and a **"Your forms"** list — one card per requirement form that is either **completed** (the user submitted it) or **requested** (the user has been asked to fill it in but hasn't). Each card opens its destination in a new tab.

Implements Jira **VOLI-944** ("[S2] Membership drill-in: org detail + requirement profile (read-only)").

## Two systems in the codebase (read first)

The backend has two independent "requirement" concepts. This feature uses **only the forms system**:

- **Forms system** — `requirement_forms` + `form_submissions`. Actual fillable forms (e.g. a monthly hours report). `submitRequiredForm` writes **only** a `form_submission` (status `SUBMITTED`). This is the source of truth for "a form is completed."
- **Requirement-profile system** — `requirement_profiles` + `requirement_profile_submissions` + `requirement_fulfillments`. Abstract requirements of type DOCUMENT / CHECK / DATE / TEXT (e.g. "upload a passport"). Fulfillments reference `requirements`, **not forms**. Membership approval gates on this (`requiredMembershipRequirementProfileId`, fulfillments `APPROVED`). **Out of scope for 944** — the drill-in shows forms, not profile requirements.

## Dependencies & foundational decisions

- **Depends on VOLI-942** (S1 accepted cards + the `myMemberships` read path), present on the base branch. This spec does not re-implement 942.
- **Card unit = per requirement form.** The list shows individual forms, not "requirement profiles" — matching the mockup's form-name cards.
- **Completed** = the user has a `SUBMITTED` `form_submission` for that form. **User-scoped** (`userId + formId`); we do **not** rely on the nullable `FormSubmission.membershipId` (which `submitRequiredForm` leaves null).
- **Requested** = forms required of this user across their **org-unit** and the **events they're invited to**, that aren't yet submitted. **Shifts are out of scope** — there is no `shift_required_forms` table and no shift form-gating today.
- **The list is the union of completed ∪ requested**, deduped by form. The org may have many other forms; we only show submitted ones and ones the user has been asked to fill in.

## What already exists (reuse, don't rebuild)

- `myMemberships` query → `{ id, createdAt, organizationUnit { id name logoUrl type{icon} organization{name} }, roles { id name } }`.
- Accepted `MembershipEntry` type + accepted `MembershipCard` on S1 (rendered, not yet linked).
- `MembershipStatusBadge` (`state="accepted"` → "Accepted").
- `DetailPageHeader` (`@repo/ui`) — `title`, `logoUrl`, `onBack`, `backLabel`, `actions`.
- `RequiredFormService.getRequiredForms({ targetType, targetId })` → lists required forms for `ORGANIZATION_UNIT` and `EVENT` targets (not `SHIFT`). Returns `{ form, order }`.
- `event_invites` (`userId`, `eventId`, `status`) — how we know which events a user is invited to.
- Public fill-out route **`/f/[token]`** — renders a form by `shareToken`, works standalone for an authenticated member. Used for "Fill in form".
- `submitRequiredForm` mutation (no changes needed) and `form_submissions` as the completion source of truth.
- `formatDate` / `useFormatter`; next-intl `en`/`de` messages.

## What's missing (in scope for 944)

1. Drill-in route + page.
2. S1 accepted card → drill-in link.
3. Owner-scoped backend queries: `myMembership(id)` and **`myOrgUnitForms(organizationUnitId)`** (the union query — the core new backend piece).
4. A new volunteer **read-only submission "View" route** + owner-scoped `myFormSubmission(id)` query.
5. A reusable **read-only submission renderer** (extracted from the admin page's inline logic).
6. i18n keys (en + de).

## 1. Routing & navigation

### Drill-in route
- Path: `apps/frontend/src/app/[locale]/(volunteering)/profile/memberships/[membershipId]/page.tsx` — **server component**, inherits profile auth/layout. Param: `membershipId`.

### S1 card → drill-in
- Wrap the accepted `MembershipCard` in a Next.js `<Link href="/{locale}/profile/memberships/{id}">`.
- The existing **Leave membership** action stays. Because a `<button>` inside an `<a>` is invalid, restructure so the link wraps the navigable area and Leave is a sibling action with `stopPropagation` (exact markup decided in the plan).

### Back navigation
- `DetailPageHeader` `onBack={() => router.back()}` via a small client wrapper (mirroring `EventPageHeader`) → returns to S1.

## 2. Data layer (backend + `packages/data`)

### `myMembership(id: ID!): Membership`
- Owner-scoped: returns the membership only if it belongs to `session.user.id`, else `null` (page renders `notFound()`).
- Returns `id`, `createdAt`, `organizationUnit { id name logoUrl type{icon} organization { id name } }`, `roles { id name }`. (We need `organization.id` to scope submitted forms — see below.)

### `myOrgUnitForms(organizationUnitId: ID!): [MyOrgUnitForm!]!`  *(the core new query)*
- Keyed by `organizationUnitId` (not `membershipId`) for consistency with sibling queries like `myFormSubmissions(organizationUnitId)` and reusability from contexts that have an org-unit but not a membership.
- Inherently user-scoped: returns only the caller's own event invites + submissions, plus the org-unit's required-form list (already exposed via `OrganizationUnit.requiredForms`). No membership-ownership gate is needed — no other user's data can leak.
- Computes the **union** of:
  1. **Requested — org-unit**: `getRequiredForms({ ORGANIZATION_UNIT, organizationUnitId })`.
  2. **Requested — events**: for each event the user is invited to (`event_invites` where `userId = session.user`, within this org-unit's org — exact invite-status filter decided in the plan), `getRequiredForms({ EVENT, eventId })`.
  3. **Completed**: the user's `form_submissions` (`status = SUBMITTED`) for forms belonging to this org-unit's organization, to capture submitted forms that may no longer be in the required set.
- Dedupe by `formId`. For each form return `{ form { id name description shareToken }, completed, submissionId, submittedAt }`, where `completed` = a SUBMITTED `form_submission` exists for this user+form (with its `id`/`submittedAt`); else `completed = false`, `submissionId = null`.
- Lives as a new resolver + service method (e.g. `RequiredFormService.formsForUser(userId, organizationUnitId)`), reusing `getRequiredForms` rather than duplicating the join logic.
- `MyOrgUnitForm` is a dedicated GraphQL type returned **only** by this owner-scoped query — it is **not** added to the shared `Membership` type, so admin-scoped resolvers can't accidentally expose "my" form statuses.
- Repository operation + codegen in `packages/data`.

## 3. Drill-in page

- Fetch `myMembership(membershipId)`; if missing → `notFound()`. Then `myOrgUnitForms(membership.organizationUnit.id)`.
- **Header** (`DetailPageHeader`): `title` = organization name (+ organization-unit name when the unit is not the root), `logoUrl`, `onBack = router.back()`.
- **Membership summary**: `MembershipStatusBadge` "Accepted" · role line (`roles.map(r => r.name).join(', ')`, omitted when empty) · `Joined · {formatDate(createdAt)}` (reuse `MembershipRequest.meta.joinedDate`).
- **"Your forms" section**: heading + subtitle, then one `Card` per form from `myOrgUnitForms` (ordered: not-completed first, then completed; or by `order` then date — decided in the plan).

### Form card
- Document icon + `form.name`.
- Status badge: `completed` → `success` "Completed"; else `alert` "Not completed".
- Description: completed → "You filled in the form on {formatDate(submittedAt)}"; not-completed → static copy, no date: "This organisation has asked you to fill in this form."
- Action (`<Link target="_blank" rel="noopener noreferrer">`): not-completed → "Fill in form" → `/{locale}/f/{form.shareToken}`; completed → "View" → `/{locale}/forms/submissions/{submissionId}`.

## 4. Read-only submission "View" (the net-new UI)

- **Route**: `apps/frontend/src/app/[locale]/(volunteering)/forms/submissions/[submissionId]/page.tsx` — server component, owner-scoped.
- **Owner-scoped query**: `myFormSubmission(id: ID!): FormSubmission` — returns the submission only if it belongs to `session.user.id`, else `null` → `notFound()`. Includes `form { id name }`, `values { fieldId value }`, `submittedAt`.
- **Reusable renderer**: extract the admin page's inline `resolveFieldAnswer` logic into `apps/frontend/src/domain/requirement-form/components/submission-view.tsx` (props: form fields + submission values + profile data). Consumed by the new volunteer route; admin route may be refactored to use it too (nice-to-have).
- **Header** (`DetailPageHeader`): `title` = form name, `onBack = router.back()`.

## 5. i18n

New keys in `apps/frontend/messages/en.json` and `de.json`, under a `MembershipDetail` namespace (reuse `MembershipRequest.meta.joinedDate` where it fits):
- `title`, `role` ("Role")
- `forms.title` ("Your forms"), `forms.subtitle` ("Forms this organisation has asked you to fill in.")
- `status.completed` ("Completed"), `status.notCompleted` ("Not completed")
- `fillIn` ("Fill in form"), `view` ("View")
- `completedOn` ("You filled in the form on {date}")
- `notCompletedPrompt` ("This organisation has asked you to fill in this form.")
- Submission view keys as needed (`SubmissionView.title`, etc.).

## 6. Acceptance criteria (from the ticket)

- [ ] Tapping an accepted `MembershipCard` on S1 opens a full-screen detail with a back control and the org name.
- [ ] The detail shows the `Accepted` status badge, the volunteer's role (view-only), and `Joined · {memberships.createdAt}`.
- [ ] Each form the user has **submitted** or **been asked to fill in** (org-unit + their events) renders a card — never the org's other forms.
- [ ] Completed card → "View" opens the submission read-only (new tab).
- [ ] Not-completed card → "Fill in form" opens the form (new tab).
- [ ] Back returns to S1.

## 7. Edge cases

- Not-owned / non-existent membership → `notFound()`. Not-owned / non-existent submission → `notFound()`.
- A form that is both requested and submitted → one card, marked completed.
- A submitted form no longer in the required set → still shows as completed (it's in the user's submitted set for this org).
- No forms at all → render the section gracefully (no crash). Full empty-state UX is **VOLI-947, out of scope**.
- Membership with no roles → role line omitted.

## 8. Out of scope

Documents / editing org fields (VOLI-943/945), pending & non-Accepted states (VOLI-946/948), empty-state UX (VOLI-947), **shift required-forms** (no schema support today), and the **requirement-profile system** (`requirement_profile_submissions` / fulfillments — a separate, non-form concept).

## 9. Open implementation details (to settle in the plan, non-blocking)

- `event_invites` status filter for "requested" event forms (e.g. INVITED + ACCEPTED vs all), and whether to scope event invites to the membership's org.
- Whether "completed" submitted forms are scoped by `organizationId` (org-level) or tighter (org-unit-level). Default: org-level.
- Card ordering (not-completed-first vs required-`order` then date).
- The S1 card markup making the whole card a link while keeping Leave a non-navigating action.
- Whether to refactor the admin submission page onto the shared read-only renderer (nice-to-have).
- The mockup shows the *same* form twice under different period labels ("Juli/Juni 2026"); this model yields one card per form. If period-specific instances are real (distinct `formId`s), they'll naturally appear as separate cards — otherwise one card. Confirm against sample data during the plan.
