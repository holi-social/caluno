import { describe, expect, it } from 'bun:test';
import { clientTimeEntrySchema } from './schemas';

const messages = {
  organizationUnitRequired: 'Organization Unit is required',
  shiftInstanceRequired: 'Shift date is required',
  volunteerRequired: 'Volunteer is required',
  startedAtRequired: 'Start time is required',
  endedAtRequired: 'End time is required',
  timeEntryIdRequired: 'Time Entry ID is required',
};

const baseValues = {
  organizationUnitId: 'org-unit-1',
  volunteerId: 'volunteer-1',
  startedAt: new Date('2026-01-01T09:00:00Z'),
  endedAt: new Date('2026-01-01T11:00:00Z'),
  hasShift: false,
};

describe('clientTimeEntrySchema', () => {
  it('accepts an entry with no shift', () => {
    const result = clientTimeEntrySchema(messages).safeParse(baseValues);
    expect(result.success).toBe(true);
  });

  it('requires a shift instance when hasShift is true', () => {
    const result = clientTimeEntrySchema(messages).safeParse({
      ...baseValues,
      hasShift: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === 'shiftInstanceId',
      );
      expect(issue?.message).toBe('Shift date is required');
    }
  });
});
