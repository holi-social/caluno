import { describe, expect, it } from 'bun:test';
import { DocumentKind, ReimbursementTypeKey } from '@repo/data';
import {
  apiDocumentKindFor,
  pauschaleForReimbursementTypeKey,
  reimbursementTypeKeyFor,
} from './reimbursement-type-mapping';

describe('reimbursementTypeKeyFor / pauschaleForReimbursementTypeKey', () => {
  it('maps both Pauschale types to their API key and back', () => {
    expect(reimbursementTypeKeyFor('ehrenamt')).toBe(
      ReimbursementTypeKey.Ehrenamt,
    );
    expect(reimbursementTypeKeyFor('uebungsleiter')).toBe(
      ReimbursementTypeKey.Uebungsleiter,
    );
    expect(
      pauschaleForReimbursementTypeKey(ReimbursementTypeKey.Ehrenamt),
    ).toBe('ehrenamt');
    expect(
      pauschaleForReimbursementTypeKey(ReimbursementTypeKey.Uebungsleiter),
    ).toBe('uebungsleiter');
  });
});

describe('apiDocumentKindFor', () => {
  it('maps prototype kinds to the API enum', () => {
    expect(apiDocumentKindFor('contract')).toBe(DocumentKind.Contract);
    expect(apiDocumentKindFor('invoice')).toBe(DocumentKind.Invoice);
  });
});
