// TEMP-CHECKIN-MIGRATION: resolves the target org unit for the legacy admin
// check-in page; goes away once check-in lives on the volunteering side.
export function resolveCheckInTargetOrg(options: {
  eligibleOrgUnitIds: string[];
  orgUIdParam?: string | undefined;
  lastVisitedOrgId: string | null;
}): string | null {
  const { eligibleOrgUnitIds, orgUIdParam, lastVisitedOrgId } = options;

  if (orgUIdParam && eligibleOrgUnitIds.includes(orgUIdParam)) {
    return orgUIdParam;
  }
  if (lastVisitedOrgId && eligibleOrgUnitIds.includes(lastVisitedOrgId)) {
    return lastVisitedOrgId;
  }
  return eligibleOrgUnitIds[0] ?? null;
}
