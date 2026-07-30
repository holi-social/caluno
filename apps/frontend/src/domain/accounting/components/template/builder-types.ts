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
  | 'volunteer_tax_id';

export const ALWAYS_AVAILABLE_SOURCES: DataSourceKey[] = [
  'volunteer_first_name',
  'volunteer_last_name',
  'org_name',
  'org_address',
  'org_city',
  'org_legal_rep',
  'pauschalen_type',
  'hourly_rate',
  'period_start',
  'period_end',
  'total_hours',
  'total_amount',
  'generated_date',
  'document_number',
];

export const PROFILE_REQUIRED_SOURCES: DataSourceKey[] = [
  'volunteer_iban',
  'volunteer_bic',
  'volunteer_address',
  'volunteer_dob',
  'volunteer_tax_id',
];

/**
 * Where a bound source's value comes from. Mostly drives the "filled from ..." line shown
 * under the field title when there's no concrete value yet to display — except
 * 'rate_settings' and 'organization_profile', which annotate a value that IS already known
 * (the hourly rate, the org's own identity fields) with where it came from, since unlike
 * volunteer/generation-time fields it's not self-evident.
 */
export type FieldOrigin =
  | 'volunteer_profile'
  | 'generation_time'
  | 'rate_settings'
  | 'organization_profile';

export const FIELD_ORIGIN: Partial<Record<DataSourceKey, FieldOrigin>> = {
  volunteer_first_name: 'volunteer_profile',
  volunteer_last_name: 'volunteer_profile',
  volunteer_iban: 'volunteer_profile',
  volunteer_bic: 'volunteer_profile',
  volunteer_address: 'volunteer_profile',
  volunteer_dob: 'volunteer_profile',
  volunteer_tax_id: 'volunteer_profile',
  generated_date: 'generation_time',
  document_number: 'generation_time',
  period_start: 'generation_time',
  period_end: 'generation_time',
  total_hours: 'generation_time',
  total_amount: 'generation_time',
  hourly_rate: 'rate_settings',
  org_name: 'organization_profile',
  org_address: 'organization_profile',
  org_city: 'organization_profile',
  org_legal_rep: 'organization_profile',
};

/** Coordinator-typed once, in the builder — reused verbatim on every document generated from this template. */
export type TemplateFieldValue =
  | { kind: 'bound'; source: DataSourceKey }
  | { kind: 'manual-template'; value: string };

export interface TemplateField {
  id: string;
  value: TemplateFieldValue;
  /** Manual-template fields only: which control to render. Plain text Input if omitted. */
  control?: 'textarea' | 'number' | 'month-year';
}

/** One line of preset German legal text with inline fields; can be independently switched off within a locked block. */
export interface TemplateLine {
  id: string;
  /** Literal German text; `{fieldId}` markers are resolved to inline chips at render time. */
  text: string;
  fields: TemplateField[];
  /** Whether this specific line can be turned off even though its parent block is locked. */
  optional: boolean;
  enabled: boolean;
}

export interface TemplateTextBlock {
  kind: 'text';
  id: string;
  /** Literal German heading — documents are always German, never i18n'd. */
  title: string;
  /** true = mandatory, no block-level toggle (lines may still have their own `optional` toggle). */
  locked: boolean;
  /** Meaningful only when locked is false. */
  enabled: boolean;
  lines: TemplateLine[];
}

export interface TemplateTableBlock {
  kind: 'table';
  id: string;
  title: string;
  locked: true;
  columns: string[];
  /** Placeholder rows shown in the builder preview; real rows come from timesheets at generation time. */
  previewRowCount: number;
}

export type TemplateBlock = TemplateTextBlock | TemplateTableBlock;

export type InvoiceNumberFormat =
  | 'date-number'
  | 'date-kostenstelle-number'
  | 'compact-date-number'
  | 'kostenstelle-month-year-number';

export interface TemplateHeader {
  /** Title text, resolved per pauschale type by the caller (see builder-document-presets.ts). */
  titleLines: string[];
  /** Contract: org name + address, top-right. Invoice: org address, left. */
  orgIdentityLine: TemplateLine;
  /** Invoice-only: document number, generation date, optional Kostenstelle — each its own line. Empty for contracts. */
  metaLines: TemplateLine[];
}

export interface TemplateFooter {
  /** "{Place}, {Date}" — Place derived from org address, Date bound to document-creation date. */
  closingLine: TemplateLine;
  /** Whether signature slots are shown — always true today; kept explicit since signing display is still an open decision. */
  showSignatures: boolean;
}

export interface TemplateDocument {
  header: TemplateHeader;
  blocks: TemplateBlock[];
  footer: TemplateFooter;
  /** Invoice-only: how the generated document number is formatted. Undefined for contracts. */
  invoiceNumberFormat?: InvoiceNumberFormat;
}

/**
 * Every (line, field) pair actually live in the document right now, in reading order —
 * header, then blocks top to bottom, then footer. Skips lines belonging to a text block
 * that's switched off (locked blocks are always active); those lines aren't rendered
 * anywhere in the editor, so their fields shouldn't count as missing or claim a "first
 * occurrence" slot either.
 */
function allLines(doc: TemplateDocument): TemplateLine[] {
  const lines = [doc.header.orgIdentityLine, ...doc.header.metaLines];
  for (const block of doc.blocks) {
    if (block.kind === 'text' && (block.locked || block.enabled)) {
      lines.push(...block.lines);
    }
  }
  lines.push(doc.footer.closingLine);
  return lines;
}

function mapFields(
  fields: TemplateField[],
  fieldId: string,
  value: string,
): TemplateField[] {
  return fields.map((f) =>
    f.id === fieldId && f.value.kind === 'manual-template'
      ? { ...f, value: { kind: 'manual-template' as const, value } }
      : f,
  );
}

function mapLines(
  lines: TemplateLine[],
  fieldId: string,
  value: string,
): TemplateLine[] {
  return lines.map((l) => ({
    ...l,
    fields: mapFields(l.fields, fieldId, value),
  }));
}

/**
 * Sets a manual-template field's value everywhere it's quoted in the document — not just the
 * line the coordinator is editing. Most manual fields only ever appear once, so this is a no-op
 * beyond that one line; the contract's shared "Contract's Lifespan" is the field this exists for.
 */
export function updateManualFieldValue(
  doc: TemplateDocument,
  fieldId: string,
  value: string,
): TemplateDocument {
  return {
    ...doc,
    header: {
      ...doc.header,
      orgIdentityLine: {
        ...doc.header.orgIdentityLine,
        fields: mapFields(doc.header.orgIdentityLine.fields, fieldId, value),
      },
      metaLines: mapLines(doc.header.metaLines, fieldId, value),
    },
    blocks: doc.blocks.map((b) =>
      b.kind === 'text'
        ? { ...b, lines: mapLines(b.lines, fieldId, value) }
        : b,
    ),
    footer: {
      ...doc.footer,
      closingLine: {
        ...doc.footer.closingLine,
        fields: mapFields(doc.footer.closingLine.fields, fieldId, value),
      },
    },
  };
}

/**
 * A manual-template field id can appear on more than one line (e.g. the contract's shared
 * "Contract's Lifespan" constant, quoted once in "Zeitraum" and again in "Freiwillige Stunden").
 * It's edited in exactly one place — this maps each such id to the line it's first editable on;
 * every other occurrence renders read-only.
 */
export function getFirstOccurrenceLineByFieldId(
  doc: TemplateDocument,
): Map<string, string> {
  const firstLineByFieldId = new Map<string, string>();
  for (const line of allLines(doc)) {
    for (const field of line.fields) {
      if (
        field.value.kind === 'manual-template' &&
        !firstLineByFieldId.has(field.id)
      ) {
        firstLineByFieldId.set(field.id, line.id);
      }
    }
  }
  return firstLineByFieldId;
}

/** Manual-template fields left blank on lines/blocks currently switched on — gates the Save button. Counts each field id once even if it's quoted on multiple lines. */
export function countIncompleteManualFields(doc: TemplateDocument): number {
  const seen = new Set<string>();
  let count = 0;
  for (const line of allLines(doc)) {
    if (!line.enabled) continue;
    for (const field of line.fields) {
      if (field.value.kind !== 'manual-template') continue;
      if (seen.has(field.id)) continue;
      seen.add(field.id);
      if (!field.value.value.trim()) count++;
    }
  }
  return count;
}
