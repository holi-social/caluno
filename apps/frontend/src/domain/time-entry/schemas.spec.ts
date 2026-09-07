import { describe, expect, it } from 'bun:test';
import { clientTimeEntrySchema } from './schemas';

const messages = {
  organizationUnitRequired: 'Organization Unit is required',
  shiftInstanceRequired: 'Shift date is required',
  volunteerRequired: 'Volunteer is required',
  startedAtRequired: 'Start time is required',
  endedAtRequired: 'End time is required',
  timeEntryIdRequired: 'Time Entry ID is required',
  reimbursementTypeRequired: 'Pauschale type is required',
};

const baseValues = {
  organizationUnitId: 'org-unit-1',
  volunteerId: 'volunteer-1',
  startedAt: new Date('2026-01-01T09:00:00Z'),
  endedAt: new Date('2026-01-01T11:00:00Z'),
  hasShift: false,
  isPaidTime: false,
};

describe('clientTimeEntrySchema', () => {
  it('accepts an unpaid entry with no reimbursement type', () => {
    const result = clientTimeEntrySchema(messages).safeParse(baseValues);
    expect(result.success).toBe(true);
  });

  it('requires a reimbursement type when marked as paid time', () => {
    const result = clientTimeEntrySchema(messages).safeParse({
      ...baseValues,
      isPaidTime: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === 'reimbursementTypeId',
      );
      expect(issue?.message).toBe('Pauschale type is required');
    }
  });

  it('accepts a paid entry once a reimbursement type is set', () => {
    const result = clientTimeEntrySchema(messages).safeParse({
      ...baseValues,
      isPaidTime: true,
      reimbursementTypeId: 'reimbursement-type-1',
    });
    expect(result.success).toBe(true);
  });

  it('still requires a shift instance when hasShift is true, independent of paid status', () => {
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
