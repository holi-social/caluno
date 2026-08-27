import { describe, expect, it } from 'bun:test';
import {
  DocumentKind,
  type DocumentTemplateSummary,
  ReimbursementTypeKey,
} from '@repo/data';
import { asInvoiceNumberFormat, findSlotTemplate } from './template-slots';

function template(
  overrides: Partial<DocumentTemplateSummary> & { id: string },
): DocumentTemplateSummary {
  return {
    kind: DocumentKind.Contract,
    isDeleted: false,
    reimbursementType: { id: 'rt-1', key: ReimbursementTypeKey.Ehrenamt },
    organizationUnit: null,
    signees: [],
    ...overrides,
  } as DocumentTemplateSummary;
}

const ARGS = {
  pauschale: 'ehrenamt',
  kind: 'contract',
  organizationUnitId: 'unit-1',
} as const;

describe('findSlotTemplate', () => {
  it('returns undefined for undefined/empty template lists', () => {
    expect(findSlotTemplate(undefined, ARGS)).toBeUndefined();
    expect(findSlotTemplate([], ARGS)).toBeUndefined();
  });

  it('matches an org-wide default template (organizationUnit null)', () => {
    const orgLevel = template({ id: 't-org' });
    expect(findSlotTemplate([orgLevel], ARGS)?.id).toBe('t-org');
  });

  it('prefers the unit-level override over the org-wide default', () => {
    const orgLevel = template({ id: 't-org' });
    const unitLevel = template({
      id: 't-unit',
      organizationUnit: { id: 'unit-1', name: 'Unit 1' },
    });
    expect(findSlotTemplate([orgLevel, unitLevel], ARGS)?.id).toBe('t-unit');
  });

  it('ignores templates of other units, kinds, types, and deleted ones', () => {
    const templates = [
      template({
        id: 'other-unit',
        organizationUnit: { id: 'unit-2', name: 'Unit 2' },
      }),
      template({ id: 'other-kind', kind: DocumentKind.Invoice }),
      template({
        id: 'other-type',
        reimbursementType: {
          id: 'rt-2',
          key: ReimbursementTypeKey.Uebungsleiter,
        },
      }),
      template({ id: 'deleted', isDeleted: true }),
    ];
    expect(findSlotTemplate(templates, ARGS)).toBeUndefined();
  });
});

describe('asInvoiceNumberFormat', () => {
  it('passes through known formats', () => {
    expect(asInvoiceNumberFormat('date-number')).toBe('date-number');
    expect(asInvoiceNumberFormat('kostenstelle-month-year-number')).toBe(
      'kostenstelle-month-year-number',
    );
  });

  it('returns undefined for unknown or missing values', () => {
    expect(asInvoiceNumberFormat('nope')).toBeUndefined();
    expect(asInvoiceNumberFormat(null)).toBeUndefined();
    expect(asInvoiceNumberFormat(undefined)).toBeUndefined();
  });
});
