import { describe, expect, it } from 'bun:test';
import { invoices } from './invoice.schema';

describe('invoices schema', () => {
  it('has a nullable fileId column', () => {
    expect(invoices.fileId).toBeDefined();
    expect(invoices.fileId.notNull).toBe(false);
  });
});
