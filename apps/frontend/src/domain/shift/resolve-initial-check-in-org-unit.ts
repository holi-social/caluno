/**
 * Picks the org unit the check-in page opens on.
 *
 * Every unit the admin holds `check-in:manage` in is selectable — the
 * volunteer's memberships are not an eligibility filter, only a preference,
 * because a non-member is a blocker the page resolves rather than hides.
 */
export function resolveInitialCheckInOrgUnit(options: {
  orgUnitIds: string[];
  memberOrgUnitIds: string[];
  orgUIdParam?: string | undefined;
}): string | null {
  const { orgUnitIds, memberOrgUnitIds, orgUIdParam } = options;

  if (orgUIdParam && orgUnitIds.includes(orgUIdParam)) {
    return orgUIdParam;
  }

  const memberIds = new Set(memberOrgUnitIds);
  return orgUnitIds.find((id) => memberIds.has(id)) ?? orgUnitIds[0] ?? null;
}
