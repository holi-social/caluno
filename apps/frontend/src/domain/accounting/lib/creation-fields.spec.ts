import { describe, expect, it } from 'bun:test';
import {
  getContractDocument,
  getInvoiceDocument,
} from '../components/template/builder-document-presets';
import { deriveEditableFields } from './creation-fields';

describe('deriveEditableFields', () => {
  it('returns the template-bound volunteer + manual fields, no hardcoded extras', () => {
    const fields = deriveEditableFields(getContractDocument('ehrenamt'));
    const ids = fields.map((f) => f.fieldId);
    const sources = fields.map((f) => f.source);

    // IBAN + BIC are both bound in the default contract preset (payout lines).
    expect(sources).toContain('volunteer_iban');
    expect(sources).toContain('volunteer_bic');

    // Manual-template fields are derived, not hardcoded.
    expect(ids).toContain('contract-lifespan');
    expect(ids).toContain('hours-amount');

    // No invented ids that aren't bound by the template (e.g. a bare `dob`
    // key, or the disabled optional address/dob/freeform lines).
    expect(ids).not.toContain('dob');
    expect(ids).not.toContain('volunteer-dob-field');
    expect(ids).not.toContain('volunteer-address-field');
    expect(ids).not.toContain('freeform-text');
  });

  it('prefills a manual-template field from its stored value (provenance template)', () => {
    const fields = deriveEditableFields(getContractDocument('ehrenamt'));
    const hoursUnit = fields.find((f) => f.fieldId === 'hours-unit');
    expect(hoursUnit?.kind).toBe('manual');
    expect(hoursUnit?.value).toBe('Monat');
    expect(hoursUnit?.provenance).toBe('template');
  });

  it('marks a bound field with a profile value provenance profile', () => {
    const fields = deriveEditableFields(getContractDocument('ehrenamt'), {
      iban: 'DE00 1234 5678 9000 0000 00',
    });
    const iban = fields.find((f) => f.source === 'volunteer_iban');
    expect(iban?.kind).toBe('bound');
    expect(iban?.value).toBe('DE00 1234 5678 9000 0000 00');
    expect(iban?.provenance).toBe('profile');
  });

  it('marks a bound field missing from the profile provenance gap', () => {
    const fields = deriveEditableFields(getContractDocument('ehrenamt'), {});
    const bic = fields.find((f) => f.source === 'volunteer_bic');
    expect(bic?.provenance).toBe('gap');
    expect(bic?.value).toBeNull();
  });

  it('dedupes manual field ids (first occurrence wins)', () => {
    const fields = deriveEditableFields(getContractDocument('ehrenamt'));
    const ids = fields.map((f) => f.fieldId);
    expect(ids.filter((id) => id === 'contract-lifespan')).toHaveLength(1);
  });

  it('carries every field id bound to a source, not just the first', () => {
    const fields = deriveEditableFields(getContractDocument('ehrenamt'));
    const firstName = fields.find((f) => f.source === 'volunteer_first_name');
    expect(firstName?.fieldIds).toEqual([
      'volunteer-name-first',
      'payout-holder-first',
    ]);
    const lastName = fields.find((f) => f.source === 'volunteer_last_name');
    expect(lastName?.fieldIds).toEqual([
      'volunteer-name-last',
      'payout-holder-last',
    ]);
    expect(firstName?.fieldId).toBe('volunteer-name-first');
  });

  it('prefills first/last name from the volunteer name, not the profile', () => {
    const fields = deriveEditableFields(
      getContractDocument('ehrenamt'),
      { name: 'Ignored', lastname: 'Ignored' },
      'Anna Müller',
    );
    const first = fields.find((f) => f.source === 'volunteer_first_name');
    const last = fields.find((f) => f.source === 'volunteer_last_name');
    expect(first?.value).toBe('Anna');
    expect(last?.value).toBe('Müller');
  });

  it('marks name sources gap when no volunteer name is supplied', () => {
    const fields = deriveEditableFields(getContractDocument('ehrenamt'), {});
    const first = fields.find((f) => f.source === 'volunteer_first_name');
    expect(first?.provenance).toBe('gap');
    expect(first?.value).toBeNull();
  });

  it('excludes org/rate/generation-time sources (not per-document editable)', () => {
    const fields = deriveEditableFields(getInvoiceDocument('ehrenamt'));
    const sources = fields.map((f) => f.source);
    expect(sources).not.toContain('org_name');
    expect(sources).not.toContain('org_address');
    expect(sources).not.toContain('org_city');
    expect(sources).not.toContain('generated_date');
    expect(sources).not.toContain('document_number');
    expect(sources).not.toContain('hourly_rate');
  });

  it('derives the invoice volunteer fields from the invoice template', () => {
    const fields = deriveEditableFields(getInvoiceDocument('ehrenamt'));
    const sources = fields.map((f) => f.source);
    expect(sources).toContain('volunteer_first_name');
    expect(sources).toContain('volunteer_last_name');
    expect(sources).toContain('volunteer_address');
    expect(sources).toContain('volunteer_iban');
  });
});
