import { describe, expect, it } from 'bun:test';
import { reimbursementRates } from './reimbursement-rate.schema';

describe('reimbursementRates schema', () => {
  it('has a nullable organizationUnitId column', () => {
    expect(reimbursementRates.organizationUnitId).toBeDefined();
    expect(reimbursementRates.organizationUnitId.notNull).toBe(false);
  });
});
