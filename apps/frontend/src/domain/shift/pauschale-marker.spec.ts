import { describe, expect, it } from 'bun:test';
import { ReimbursementTypeKey } from '@repo/data';
import { resolvePauschaleMarker } from './pauschale-marker';

const types = [
  { id: 'type-ep', key: ReimbursementTypeKey.Ehrenamt },
  { id: 'type-ul', key: ReimbursementTypeKey.Uebungsleiter },
];

describe('resolvePauschaleMarker', () => {
  it('returns null for an unpaid shift (no reimbursement type id)', () => {
    expect(resolvePauschaleMarker(null, types)).toBeNull();
    expect(resolvePauschaleMarker(undefined, types)).toBeNull();
    expect(resolvePauschaleMarker('', types)).toBeNull();
  });

  it('returns null while reimbursement types are still loading', () => {
    expect(resolvePauschaleMarker('type-ep', undefined)).toBeNull();
    expect(resolvePauschaleMarker('type-ep', null)).toBeNull();
  });

  it('returns null when the id does not match a known type', () => {
    expect(resolvePauschaleMarker('unknown-id', types)).toBeNull();
  });

  it('resolves the Ehrenamtspauschale marker', () => {
    expect(resolvePauschaleMarker('type-ep', types)).toBe('ehrenamt');
  });

  it('resolves the Übungsleiterpauschale marker', () => {
    expect(resolvePauschaleMarker('type-ul', types)).toBe('uebungsleiter');
  });
});
