import type { DocumentTemplateSummary, InvoiceNumberFormat } from '@repo/data';
import type { PauschalenType } from '../components/doc-type-header';
import {
  apiDocumentKindFor,
  reimbursementTypeKeyFor,
} from './reimbursement-type-mapping';

/**
 * The template a slot (kind × Pauschale type) resolves to at an org unit: the
 * unit-level override when one exists, else the org-wide default
 * (`organizationUnit: null`). Mirrors the backend's `findActiveTemplate`
 * resolution; soft-deleted templates never count.
 */
export function findSlotTemplate(
  templates: DocumentTemplateSummary[] | undefined,
  args: {
    pauschale: PauschalenType;
    kind: 'contract' | 'invoice';
    organizationUnitId: string;
  },
): DocumentTemplateSummary | undefined {
  if (!templates) return undefined;
  const kind = apiDocumentKindFor(args.kind);
  const key = reimbursementTypeKeyFor(args.pauschale);
  const candidates = templates.filter(
    (template) =>
      !template.isDeleted &&
      template.kind === kind &&
      template.reimbursementType.key === key,
  );
  return (
    candidates.find(
      (template) => template.organizationUnit?.id === args.organizationUnitId,
    ) ?? candidates.find((template) => template.organizationUnit == null)
  );
}

const INVOICE_NUMBER_FORMATS: readonly InvoiceNumberFormat[] = [
  'date-number',
  'date-kostenstelle-number',
  'compact-date-number',
  'kostenstelle-month-year-number',
];

/** Narrows the API's free-form `invoiceNumberFormat` string to the known formats. */
export function asInvoiceNumberFormat(
  value: string | null | undefined,
): InvoiceNumberFormat | undefined {
  return INVOICE_NUMBER_FORMATS.find((format) => format === value);
}
