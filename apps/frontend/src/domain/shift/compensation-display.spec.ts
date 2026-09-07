import { describe, expect, it } from 'bun:test';
import { ReimbursementTypeKey } from '@repo/data';
import { compensationLabelFor } from './compensation-display';

const labels = {
  ehrenamt: 'Compensated via volunteer allowance',
  uebungsleiter: "Compensated via trainer's allowance",
};

describe('compensationLabelFor', () => {
  it('returns the Ehrenamt label for EHRENAMT', () => {
    expect(compensationLabelFor(ReimbursementTypeKey.Ehrenamt, labels)).toBe(
      labels.ehrenamt,
    );
  });

  it('returns the Uebungsleiter label for UEBUNGSLEITER', () => {
    expect(
      compensationLabelFor(ReimbursementTypeKey.Uebungsleiter, labels),
    ).toBe(labels.uebungsleiter);
  });

  it('returns null for an unpaid shift (no reimbursement type)', () => {
    expect(compensationLabelFor(null, labels)).toBeNull();
    expect(compensationLabelFor(undefined, labels)).toBeNull();
  });
});
