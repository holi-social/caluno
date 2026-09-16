# Accounting domain (frontend)

The reimbursements backoffice: contracts, timesheets ("invoices" in the API),
document templates, rates, and the per-volunteer board. Rendered under
`/admin/[orgUId]/accounting/*`.

## Layout
- `components/` — board, document sheet, creation modals, template builder.
- `lib/` — pure logic (board filtering, setup gating, period maths, money,
  field derivation). Keep logic here so it is unit-testable; components stay thin.
- `hooks/` — domain-specific react-query wrappers.

All data access goes through `@repo/data` hooks (`@repo/data/react`). Do not
write GraphQL in this domain.

## Error handling — read before touching any `isError` / catch

Client hooks build the SDK through `useSdk()`
(`packages/data/src/react/hooks/use-graphql-client.ts`), which wraps every call
in `createSdkErrorWrapper`. A failed query or `mutateAsync` therefore rejects
with a `DataError` whose `.message` is the backend's message and whose
`.options.code` is the GraphQL error code (`NOT_FOUND`, `FORBIDDEN`, …).

Rules:
- Branch on `error instanceof DataError && error.options?.code === '...'`,
  never on message text.
- **Never render `error.message` to the user.** For an unexpected failure the
  raw `graphql-request` `ClientError.message` is the *entire serialized
  response*, and backend messages can carry internal ids (e.g. a
  reimbursement-type UUID). Map known states to copy in
  `messages/{en,de}.json`; otherwise show a generic "try again".
- Both the server `DataClient` (`packages/data/src/client/data-client.ts`) and
  the React `useSdk` must translate. A new client path that skips the wrapper
  makes every `instanceof DataError` guard silently false — which is exactly
  how the "raw error screen" in VOLI-1337 happened.
- `fromGraphQLError` is idempotent, so re-translating an already-translated
  error is safe.

## Missing templates are an ordinary state, not an error

An org that only uses one Pauschale will have no template for the other, so
"no template yet" is a normal configuration, not a failure to apologise for.

- The backend throws `NotFoundGraphQLError` (`No {kind} template configured for
  reimbursement type {id}`) from `DocumentTemplateService.findActiveTemplate`.
- The creation modals (`contract-creation-modal.tsx`,
  `invoice-creation-modal.tsx`) detect that NOT_FOUND and show dedicated copy
  (`noTemplateTitle` / `noTemplateDescription`) plus a CTA to
  `/admin/[orgUId]/accounting/settings/templates`. They must **not** show the
  raw server message — it contains the reimbursement-type id.

### Gate the action before the click

`accountingSetupStatus.canCreateDocuments` is org-wide
(`slots.some(slot => slot.ready)`), so it is `true` as soon as *any* Pauschale is
configured. It does not protect the other Pauschale's rows. Use the per-type
helpers in `lib/setup-status.ts`:

- `templateReadinessByPauschale(status)` → `{ [pauschale]: { contract, invoice } }`
- `documentCreationBlockedFor(readiness, pauschale, kind)` → whether creating
  that document would dead-end. A **contract** needs its contract template; an
  **invoice/timesheet** needs both (creating one auto-drafts a contract).

`reimbursements-page-header.tsx` computes readiness and threads it through the
board, table and document sheet; the create action is disabled and the
`docs.statusLabel.templateMissingHint` tooltip is shown when blocked. If you add
a new create entry point, thread `templateReadiness` through it too.

## Vocabulary
- The board UI says **timesheet**; the API enum and the modals say **invoice**
  (`DocumentKind.INVOICE`). They are the same document.
- Pauschale ids (`ehrenamt`, `uebungsleiter`) ↔ `ReimbursementTypeKey` live in
  `lib/reimbursement-type-mapping.ts`. Never hard-code the enum strings.

## Conventions
- Multi-tenancy: take the org from `useOrgUId()` / the route, never from
  arbitrary arguments.
- All user-facing strings live in `apps/frontend/messages/{en,de}.json`; add to
  both locales. Do not hard-code copy.
- Tests are `bun:test` with no DOM. Keep logic in `lib/` pure and covered by
  co-located `*.spec.ts` (see `setup-status.spec.ts`).
