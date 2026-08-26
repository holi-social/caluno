// The document/block/field shapes are the shared frontend narrowing of the
// backend's opaque `DocumentTemplate.body` JSON, owned by
// `packages/data/src/repositories/accounting/template-body.types.ts` and
// re-exported here so the builder's existing imports keep working. This file
// adds only the builder-side constants and mutation helpers that operate on
// those shapes (the shared package intentionally stays shape-only).
import type {
  DataSourceKey,
  TemplateDocument,
  TemplateField,
  TemplateLine,
} from '@repo/data';

export type {
  DataSourceKey,
  InvoiceNumberFormat,
  TableFirstColumnSource,
  TemplateBlock,
  TemplateDocument,
  TemplateField,
  TemplateFieldValue,
  TemplateFooter,
  TemplateHeader,
  TemplateLine,
  TemplateNoteBlock,
  TemplateTableBlock,
  TemplateTextBlock,
} from '@repo/data';

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
  'contract_period',
  'already_received_amount',
  'yearly_limit_amount',
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
 * 'rate_settings', 'organization_profile', and 'yearly_limit', which annotate a value that IS
 * already known (the hourly rate, the org's own identity fields, the statutory yearly cap)
 * with where it came from, since unlike volunteer/generation-time fields it's not self-evident.
 */
export type FieldOrigin =
  | 'volunteer_profile'
  | 'generation_time'
  | 'rate_settings'
  | 'organization_profile'
  | 'yearly_limit';

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
  contract_period: 'generation_time',
  already_received_amount: 'generation_time',
  hourly_rate: 'rate_settings',
  org_name: 'organization_profile',
  org_address: 'organization_profile',
  org_city: 'organization_profile',
  org_legal_rep: 'organization_profile',
  yearly_limit_amount: 'yearly_limit',
};

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

/** Reads a manual-template field's stored value, e.g. the template's baked-in hours unit — undefined if the field doesn't exist or isn't manual. */
export function getManualFieldValue(
  doc: TemplateDocument,
  fieldId: string,
): string | undefined {
  for (const line of allLines(doc)) {
    for (const field of line.fields) {
      if (field.id === fieldId && field.value.kind === 'manual-template') {
        return field.value.value;
      }
    }
  }
  return undefined;
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
  // The table's first-column label is only a manual value the coordinator must fill in
  // when they've chosen 'custom' — the other source needs nothing typed in.
  for (const block of doc.blocks) {
    if (
      block.kind === 'table' &&
      block.firstColumnSource === 'custom' &&
      !block.firstColumnCustomLabel.trim()
    ) {
      count++;
    }
  }
  return count;
}
