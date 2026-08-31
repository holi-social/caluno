import { describe, expect, it } from 'bun:test';
import { resolveCheckInTargetOrg } from '../resolve-check-in-target-org';

describe('resolveCheckInTargetOrg', () => {
  const eligible = ['org-a', 'org-b'];

  it('prefers the query param when it is eligible', () => {
    expect(
      resolveCheckInTargetOrg({
        eligibleOrgUnitIds: eligible,
        orgUIdParam: 'org-b',
        lastVisitedOrgId: 'org-a',
      }),
    ).toBe('org-b');
  });

  it('falls back to the last-visited org when the param is missing or ineligible', () => {
    expect(
      resolveCheckInTargetOrg({
        eligibleOrgUnitIds: eligible,
        orgUIdParam: 'org-x',
        lastVisitedOrgId: 'org-a',
      }),
    ).toBe('org-a');
    expect(
      resolveCheckInTargetOrg({
        eligibleOrgUnitIds: eligible,
        lastVisitedOrgId: 'org-b',
      }),
    ).toBe('org-b');
  });

  it('falls back to the first eligible org when nothing else applies', () => {
    expect(
      resolveCheckInTargetOrg({
        eligibleOrgUnitIds: eligible,
        lastVisitedOrgId: 'org-x',
      }),
    ).toBe('org-a');
  });

  it('returns null when there is no eligible org unit', () => {
    expect(
      resolveCheckInTargetOrg({
        eligibleOrgUnitIds: [],
        orgUIdParam: 'org-a',
        lastVisitedOrgId: 'org-a',
      }),
    ).toBeNull();
  });
});
