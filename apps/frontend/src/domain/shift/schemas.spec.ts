import { describe, expect, it } from 'bun:test';
import { editShiftInstanceFormSchema, shiftFormSchema } from './schemas';

const messages = {
  nameRequired: 'Name is required',
  startTimeRequired: 'Start time is required',
  endTimeRequired: 'End time is required',
  minMaxVolunteers: 'Minimum volunteers cannot exceed maximum volunteers',
};

function baseShift(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Morning shift',
    startsAt: new Date('2026-08-01T09:00:00Z'),
    endsAt: new Date('2026-08-01T12:00:00Z'),
    ...overrides,
  };
}

describe('shiftFormSchema min/max volunteers', () => {
  it('accepts both fields empty', () => {
    const result = shiftFormSchema(messages).safeParse(baseShift());
    expect(result.success).toBe(true);
  });

  it('accepts only minVolunteers set', () => {
    const result = shiftFormSchema(messages).safeParse(
      baseShift({ minVolunteers: 2 }),
    );
    expect(result.success).toBe(true);
  });

  it('accepts only maxVolunteers set', () => {
    const result = shiftFormSchema(messages).safeParse(
      baseShift({ maxVolunteers: 10 }),
    );
    expect(result.success).toBe(true);
  });

  it('accepts minVolunteers equal to maxVolunteers', () => {
    const result = shiftFormSchema(messages).safeParse(
      baseShift({ minVolunteers: 5, maxVolunteers: 5 }),
    );
    expect(result.success).toBe(true);
  });

  it('accepts minVolunteers of 0', () => {
    const result = shiftFormSchema(messages).safeParse(
      baseShift({ minVolunteers: 0, maxVolunteers: 5 }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects minVolunteers greater than maxVolunteers', () => {
    const result = shiftFormSchema(messages).safeParse(
      baseShift({ minVolunteers: 10, maxVolunteers: 5 }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toEqual(['maxVolunteers']);
      expect(issue?.message).toBe(messages.minMaxVolunteers);
    }
  });

  it('rejects negative minVolunteers', () => {
    const result = shiftFormSchema(messages).safeParse(
      baseShift({ minVolunteers: -1 }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects non-integer maxVolunteers', () => {
    const result = shiftFormSchema(messages).safeParse(
      baseShift({ maxVolunteers: 2.5 }),
    );
    expect(result.success).toBe(false);
  });
});

function baseInstance(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Morning shift',
    startsAt: new Date('2026-08-01T09:00:00Z'),
    endsAt: new Date('2026-08-01T12:00:00Z'),
    applyToAllFuture: false,
    ...overrides,
  };
}

describe('editShiftInstanceFormSchema', () => {
  it('rejects an empty name', () => {
    const result = editShiftInstanceFormSchema(messages).safeParse(
      baseInstance({ name: '' }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects a missing startsAt', () => {
    const { startsAt: _startsAt, ...rest } = baseInstance();
    const result = editShiftInstanceFormSchema(messages).safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects a missing endsAt', () => {
    const { endsAt: _endsAt, ...rest } = baseInstance();
    const result = editShiftInstanceFormSchema(messages).safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects minVolunteers greater than maxVolunteers', () => {
    const result = editShiftInstanceFormSchema(messages).safeParse(
      baseInstance({ minVolunteers: 10, maxVolunteers: 5 }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toEqual(['maxVolunteers']);
      expect(issue?.message).toBe(messages.minMaxVolunteers);
    }
  });

  it('accepts only the always-visible fields with applyToAllFuture false', () => {
    const result = editShiftInstanceFormSchema(messages).safeParse(
      baseInstance({
        location: 'Main Hall',
        instructions: 'Bring gloves',
        minVolunteers: 1,
        maxVolunteers: 5,
      }),
    );
    expect(result.success).toBe(true);
  });

  it('accepts the series-only fields when applyToAllFuture is true', () => {
    const result = editShiftInstanceFormSchema(messages).safeParse(
      baseInstance({
        applyToAllFuture: true,
        recurrenceDays: ['MONDAY', 'WEDNESDAY'],
        imageFileId: '11111111-1111-4111-8111-111111111111',
        openShift: false,
        requiredFormIds: ['form-1'],
      }),
    );
    expect(result.success).toBe(true);
  });
});
