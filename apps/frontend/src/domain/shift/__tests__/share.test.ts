import { describe, expect, it } from 'bun:test';
import { shiftPublicPath } from '../share';

describe('shiftPublicPath', () => {
  it('returns the master path when instanceId is omitted', () => {
    expect(shiftPublicPath('shift-1')).toBe('/shifts/shift-1');
  });

  it('appends instanceId as a query param when provided', () => {
    expect(shiftPublicPath('shift-1', 'instance-1')).toBe(
      '/shifts/shift-1?instanceId=instance-1',
    );
  });

  it('encodes special characters in instanceId', () => {
    expect(shiftPublicPath('shift-1', 'a b/c')).toBe(
      '/shifts/shift-1?instanceId=a%20b%2Fc',
    );
  });
});
