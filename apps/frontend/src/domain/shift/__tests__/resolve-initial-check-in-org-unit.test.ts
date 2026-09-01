import { describe, expect, it } from 'bun:test';
import { resolveInitialCheckInOrgUnit } from '../resolve-initial-check-in-org-unit';

describe('resolveInitialCheckInOrgUnit', () => {
  const orgUnitIds = ['ou-a', 'ou-b', 'ou-c'];

  it('prefers the query param when it names a selectable unit', () => {
    expect(
      resolveInitialCheckInOrgUnit({
        orgUnitIds,
        memberOrgUnitIds: ['ou-c'],
        orgUIdParam: 'ou-b',
      }),
    ).toBe('ou-b');
  });

  it('ignores a query param naming a unit the admin cannot check into', () => {
    expect(
      resolveInitialCheckInOrgUnit({
        orgUnitIds,
        memberOrgUnitIds: ['ou-c'],
        orgUIdParam: 'ou-zzz',
      }),
    ).toBe('ou-c');
  });

  it('prefers the first selectable unit the volunteer belongs to', () => {
    expect(
      resolveInitialCheckInOrgUnit({
        orgUnitIds,
        memberOrgUnitIds: ['ou-c', 'ou-b'],
      }),
    ).toBe('ou-b');
  });

  it('falls back to the first selectable unit when the volunteer belongs to none', () => {
    expect(
      resolveInitialCheckInOrgUnit({ orgUnitIds, memberOrgUnitIds: [] }),
    ).toBe('ou-a');
  });

  it('returns null when there is nothing to select', () => {
    expect(
      resolveInitialCheckInOrgUnit({
        orgUnitIds: [],
        memberOrgUnitIds: ['ou-a'],
        orgUIdParam: 'ou-a',
      }),
    ).toBeNull();
  });
});
