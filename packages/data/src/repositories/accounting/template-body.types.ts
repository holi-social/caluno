// Frontend-only narrowing of the backend's opaque `DocumentTemplate.body`
// JSON scalar (see `apps/backend/src/accounting/schemas/document-template.schema.ts`'s
// `DocumentTemplateBody = { header: unknown, blocks: unknown[], footer: unknown }`).
// The backend stores and returns this as untyped JSONB; this file gives the
// document-template builder a real shape to work with on the client side,
// plus conversion helpers to/from the `Record<string, unknown>` shape that
// codegen produces for the `JSON` scalar.
//
// The shapes below are ported from the prototype's
// `apps/frontend/src/domain/accounting/components/template/builder-types.ts`
// (origin/VOLI-676---volunteer-reimbursement) — types only. The prototype's
// mutation helpers (e.g. `updateManualFieldValue`) belong to the builder
// component itself and are intentionally not ported here.

export type DataSourceKey =
  | 'volunteer_first_name'
  | 'volunteer_last_name'
  | 'org_name'
  | 'org_address'
  | 'org_city'
  | 'org_legal_rep'
  | 'pauschalen_type'
  | 'hourly_rate'
  | 'period_start'
  | 'period_end'
  | 'total_hours'
  | 'total_amount'
  | 'generated_date'
  | 'document_number'
  | 'volunteer_iban'
  | 'volunteer_bic'
  | 'volunteer_address'
  | 'volunteer_dob'
  | 'volunteer_tax_id'
  | 'contract_period'
  | 'already_received_amount'
  | 'yearly_limit_amount';

/** Coordinator-typed once, in the builder — reused verbatim on every document generated from this template. */
export type TemplateFieldValue =
  | { kind: 'bound'; source: DataSourceKey }
  | { kind: 'manual-template'; value: string };

export type TemplateField = {
  id: string;
  value: TemplateFieldValue;
  /** Manual-template fields only: which control to render. Plain text Input if omitted. */
  control?: 'textarea' | 'number' | 'period' | 'unit-tabs';
};

/** One line of preset German legal text with inline fields; can be independently switched off within a locked block. */
export type TemplateLine = {
  id: string;
  /** Literal German text; `{fieldId}` markers are resolved to inline chips at render time. */
  text: string;
  fields: TemplateField[];
  /** Whether this specific line can be turned off even though its parent block is locked. */
  optional: boolean;
  enabled: boolean;
};

export type TemplateTextBlock = {
  kind: 'text';
  id: string;
  /** Literal German heading — documents are always German, never i18n'd. */
  title: string;
  /** true = mandatory, no block-level toggle (lines may still have their own `optional` toggle). */
  locked: boolean;
  /** Meaningful only when locked is false. */
  enabled: boolean;
  lines: TemplateLine[];
};

/** What populates the Stundennachweis table's first column — the task description written into the volunteer's agreement, or a coordinator-typed custom label. */
export type TableFirstColumnSource = 'agreement_task_description' | 'custom';

export type TemplateTableBlock = {
  kind: 'table';
  id: string;
  title: string;
  locked: true;
  columns: string[];
  /** Placeholder rows shown in the builder preview; real rows come from timesheets at generation time. */
  previewRowCount: number;
  firstColumnSource: TableFirstColumnSource;
  /** Coordinator-typed label shown in the first column when firstColumnSource is 'custom'; ignored otherwise. */
  firstColumnCustomLabel: string;
};

/** A single locked line of plain text with inline bound-field chips — no toggle, no nested card. */
export type TemplateNoteBlock = {
  kind: 'note';
  id: string;
  title: string;
  locked: true;
  line: TemplateLine;
};

export type TemplateBlock =
  | TemplateTextBlock
  | TemplateTableBlock
  | TemplateNoteBlock;

export type InvoiceNumberFormat =
  | 'date-number'
  | 'date-kostenstelle-number'
  | 'compact-date-number'
  | 'kostenstelle-month-year-number';

export type TemplateHeader = {
  /** Title text, resolved per pauschale type by the caller. */
  titleLines: string[];
  /** Contract: org name + address, top-right. Invoice: org address, left. */
  orgIdentityLine: TemplateLine;
  /** Invoice-only: document number, generation date, optional Kostenstelle — each its own line. Empty for contracts. */
  metaLines: TemplateLine[];
};

export type TemplateFooter = {
  /** "{Place}, {Date}" — Place derived from org address, Date bound to document-creation date. */
  closingLine: TemplateLine;
  /** Whether signature slots are shown — always true today; kept explicit since signing display is still an open decision. */
  showSignatures: boolean;
};

export type TemplateDocument = {
  header: TemplateHeader;
  blocks: TemplateBlock[];
  footer: TemplateFooter;
  /** Invoice-only: how the generated document number is formatted. Undefined for contracts. */
  invoiceNumberFormat?: InvoiceNumberFormat;
};

export function serializeTemplateBody(
  document: TemplateDocument,
): Record<string, unknown> {
  return document as unknown as Record<string, unknown>;
}

export function parseTemplateBody(
  raw: Record<string, unknown>,
): TemplateDocument {
  const header = (raw.header ?? {}) as TemplateHeader;
  header.metaLines = header.metaLines ?? [];
  const blocks = (
    Array.isArray(raw.blocks) ? raw.blocks : []
  ) as TemplateBlock[];
  const footer = (raw.footer ?? {}) as TemplateFooter;
  const invoiceNumberFormat = raw.invoiceNumberFormat as
    | InvoiceNumberFormat
    | undefined;
  return { header, blocks, footer, invoiceNumberFormat };
}
