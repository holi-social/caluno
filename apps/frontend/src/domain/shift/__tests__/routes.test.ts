import { describe, expect, it } from 'bun:test';
import { shiftCreatedSuccessPath, shiftInvitePath } from '../routes';

describe('shiftCreatedSuccessPath', () => {
  it('builds the shifts list URL with created and shift params', () => {
    expect(shiftCreatedSuccessPath('org-1', 'shift-1')).toBe(
      '/admin/org-1/shifts?created=true&shift=shift-1',
    );
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
