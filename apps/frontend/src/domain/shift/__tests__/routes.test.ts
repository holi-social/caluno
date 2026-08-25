import { describe, expect, it } from 'bun:test';
import { extractCheckInPath, shiftInvitePath } from '../routes';

describe('extractCheckInPath', () => {
  it('extracts the check-in path from a full scanned URL', () => {
    expect(
      extractCheckInPath('https://app.caluno.com/admin/check-in/abc123def456'),
    ).toBe('/admin/check-in/abc123def456');
  });

  it('is case-insensitive on the id', () => {
    expect(
      extractCheckInPath('https://app.caluno.com/admin/check-in/ABC123DEF456'),
    ).toBe('/admin/check-in/ABC123DEF456');
  });

  it('returns null for a value that is not a check-in URL', () => {
    expect(extractCheckInPath('https://app.caluno.com/discover')).toBeNull();
  });

  it('returns null for a check-in id of the wrong length', () => {
    expect(
      extractCheckInPath('https://app.caluno.com/admin/check-in/short'),
    ).toBeNull();
  });
});

describe('shiftInvitePath', () => {
  it('builds the invite URL with just instanceId when no options are given', () => {
    expect(shiftInvitePath('org-1', 'shift-1', 'instance-1')).toBe(
      '/admin/org-1/shifts/shift-1/invite?instanceId=instance-1',
    );
  });

  it('appends flow=create when requested', () => {
    expect(
      shiftInvitePath('org-1', 'shift-1', 'instance-1', { flow: 'create' }),
    ).toBe(
      '/admin/org-1/shifts/shift-1/invite?instanceId=instance-1&flow=create',
    );
  });
});
