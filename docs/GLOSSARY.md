A shared language that we (humans), agents, code and UI all speak.

## Contents

1. [Organization & structure](#1-organization--structure)
2. [People & membership](#2-people--membership)
3. [Roles & permissions](#3-roles--permissions)
4. [Shifts](#4-shifts)
5. [Events](#5-events)
6. [Time tracking](#6-time-tracking)
7. [Requirement profiles & onboarding](#7-requirement-profiles--onboarding)
8. [App surfaces & routing](#8-app-surfaces--routing)

---

## 1. Organization & structure

### Organization | Org
- This is the tenant in a multi-tenant system.
- It usually represents one organization/NGO.
- Roles and requirement profiles are scoped to the organization.
- Each org has exactly one root organization unit.

### Organization Unit | Org Unit
- A node in the org's hierarchy. Shifts, events, and memberships belong to an org unit.
- Org units can have a parent org unit, forming a tree under the organization.
- Each org unit has a type (name, description, icon) for classification.
- An org unit can require a requirement profile before membership requests are approved (`requiredMembershipRequirementProfileId`).

### Root Organization Unit
- The organization unit directly connected to the organization (1:1). It has no parent organization unit.
- Exactly one per organization (`parentId IS NULL`).

### Organization Tree
- The hierarchical tree of org units under an organization, used in backoffice navigation and permission scoping.

---

## 2. People & membership

### User
- An authenticated account (Better Auth). Global across organizations.
- Each user has a unique `checkInId` used for QR check-in.

### Members
- A user becomes a member when they have an accepted membership in an organization unit.
- By default a user becomes a member of an organization when they join one of its organization units.

### Membership
- The link between a user and an organization unit.
- Carries one or more roles via membership roles.

### Membership Request
- A pending application to join an org unit, reviewed by admins.
- Status: `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`.
- Can store intended shift/event IDs in metadata — auto-joined after approval.

### Join Status
- Outcome when a user tries to join an org, shift, or event: `JOINED`, `PENDING`, `REJECTED`, `REQUIREMENTS_NEEDED`.

---

## 3. Roles & permissions

### Role
- Available roles are attached and managed on the organization.
- A user gets assigned a role when they join an organization unit and become a member.
- Being assigned a role means you get permissions in that organization unit and any of its child organization units (permission inheritance).

### System Role
- A role with `isInternal: true`, seeded by the platform and shown as "System" in the UI.
- **Owner** — created with a new org; has all permissions.
- **Member** — assigned on membership approval; has `org:view` only.

### Volunteer
- A member who has only the `org:view` (backoffice) permission in the organization unit.

### Administrator | Admin
- A member who has more than the `org:view` permission in the organization unit.

### Permissions
- Backoffice permissions use `domain:action` keys. If a user has any permission beyond `org:view`, they can access the backoffice.
- **org:view** — view organization and org units.
- **org:edit** — edit organization settings and org units.
- **volunteer:view** — view volunteers and membership requests.
- **volunteer:edit** — approve/reject requests, manage volunteers.
- **shift:view** — view shifts, instances, and time entries.
- **shift:edit** — create/edit shifts, check-in/out, manage time entries.
- **requirement-profile:view** — view requirement profiles, forms, and fulfillments.
- **requirement-profile:edit** — edit profiles, forms, blocks; approve fulfillments.

---

## 4. Shifts

### Shift
- A volunteer work definition belonging to an org unit. Can be one-time or recurring.
- Has title, location (free text), visibility, max volunteers, start time, duration, and an optional `rrule` for recurrence.
- **Visibility:** `ALL_MEMBERS` (open) or `INVITED_MEMBERS` (invite-only).
- When `rrule` is `null`, the shift is one-time. When set, the backend expands it into shift instances.

### Recurrence / RRULE
- iCal recurrence rule string stored on `shifts.rrule` (e.g. `FREQ=WEEKLY;BYDAY=MO,WE,FR`).
- Built from the admin form (recurrence days + optional end date), expanded by `expandShift()` into shift instances.
- The UI shows friendly labels ("One-time", "Weekly (Mon, Wed)") — not the raw string.

### Shift Instance
- One occurrence of a shift — the actual start/end time volunteers show up for.
- References its parent shift via `masterId` (GraphQL field: `master`).
- Can override title, location, instructions, or capacity. Can be cancelled or marked as an exception.

### Shift Instance Invite
- Per-user invite to a specific shift instance.
- Status: `PENDING`, `ACCEPTED`, `REJECTED`.

### Location
- Free-text place description on a shift — not a separate database entity.

---

## 5. Events

### Event
- A one-off org-unit activity with fixed start/end times, location (free text), and optional branding images.
- Not recurring — unlike shifts, events have no `rrule` or instances.

### Event Invite
- Per-user invite to an event.
- Status: `PENDING`, `ACCEPTED`, `REJECTED`.

### Location
- Free-text place description on an event — not a separate database entity.

---

## 6. Time tracking

### Time Entry
- Record of volunteer time on a shift instance: `startedAt`, optional `endedAt`, notes.
- The underlying data model; one volunteer can have multiple entries per instance.

### Timesheet
- UI label for viewing and managing time entries.
- Volunteering side: "My Time". Backoffice: org-wide time entry management.

### Check-in / Check-out
- Admin flow: scan a volunteer's QR iD → look up by `checkInId` → open or close a time entry on a shift instance.

### QR iD
- A personal and unique QR code for each user, derived from their `checkInId`.
- Used to check that person into a shift.

---

## 7. Requirement profiles & onboarding

### Requirement Profile
- A named set of onboarding requirements scoped to an organization.
- Used as a checklist volunteers must complete (documents, checks, dates, text).

### Requirement
- A single item within a requirement profile.
- Types: `DOCUMENT`, `CHECK`, `DATE`, `TEXT`. Can be mandatory.

### Requirement Profile Submission
- A user's submission of a requirement profile, linked to a membership or membership request.
- Status: `DRAFT` → `SUBMITTED` → `APPROVED` / `REJECTED`.

### Requirement Fulfillment
- Fulfillment of one requirement within a submission. Holds value JSON and review status.

### Organization User Profile
- Per-user, per-organization record tracking onboarding status.
- Status: `PENDING`, `ACTIVE`, `BLACKLISTED`, `INACTIVE`.

### User Profile
- Global user data store (JSON `data` field), reused across forms and requirement fulfillments.

### Document
- Uploaded file metadata (storage key, mime type) tied to a user.

### Requirement Form
- A composable public or embeddable onboarding form built from form blocks.
- Has a `shareToken` for public access at `/f/[token]`.
- Completing a form can trigger a membership request.

### Form Block
- A reusable section of fields within an organization, composed into requirement forms.

### Form Block Field
- An individual field in a form block (e.g. TEXT, EMAIL, IBAN, DOCUMENT_ACKNOWLEDGEMENT).

### Form Submission
- A completed requirement form by a user. Status: `SUBMITTED`, `REJECTED`.

### Share Token
- Public token on a requirement form. Accessed at `/f/[token]` without authentication.

---

## 8. App surfaces & routing

### Volunteering side
- Primarily for volunteers — they can find and join shifts, view their QR iD, complete requirement profiles, and see time worked.
- Routes under `(volunteering)/`: home, QR iD, My Time, profile. Mobile-first navigation.
- It's everything a volunteer needs.

### Backoffice side
- Administrative side for org managers.
- Shifts are created, planned, and managed. Volunteers and their information (timesheets, requirement profiles) are managed.
- Routes under `/admin/[orgUId]/…`: shifts, timesheets, volunteers, check-in, requirement forms, settings.

### Public routes
- Unauthenticated or pre-auth flows: `/invite/[orgId]`, `/shifts/[shiftId]`, `/f/[token]`.

### Invite flow
- Public URL to join an org unit. May require completing a requirement profile first.
