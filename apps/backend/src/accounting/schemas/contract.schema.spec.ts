import { describe, expect, it } from 'bun:test';
import { contracts } from './contract.schema';

describe('contracts schema', () => {
  it('has a nullable fileId column', () => {
    expect(contracts.fileId).toBeDefined();
    expect(contracts.fileId.notNull).toBe(false);
  });
});
