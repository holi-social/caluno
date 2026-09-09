import type { DataSourceKey, TemplateDocument, TemplateLine } from '@repo/data';

export type DerivedFieldKind = 'bound' | 'manual';
export type DerivedFieldProvenance = 'template' | 'profile' | 'gap';

export interface DerivedField {
  fieldId: string;
  labelKey: string;
  kind: DerivedFieldKind;
  source?: DataSourceKey;
  value: string | null;
  provenance: DerivedFieldProvenance;
}

const PROFILE_SOURCE_TO_PROFILE_KEY: Partial<Record<DataSourceKey, string>> = {
  volunteer_first_name: 'name',
  volunteer_last_name: 'lastname',
  volunteer_address: 'address',
  volunteer_iban: 'iban',
  volunteer_bic: 'bic',
  volunteer_dob: 'birth-date',
  volunteer_tax_id: 'tax-id',
};

/**
 * The editable, per-document field list a creation modal renders — exactly the
 * fields the template binds, nothing hardcoded. Manual-template fields prefilled
 * from the template's stored value; volunteer-profile bound fields prefilled from
 * the profile (or marked gap). Org/rate/generation-time sources are resolved
 * elsewhere at creation and are not per-document editable, so they are excluded.
 */
export function deriveEditableFields(
  document: TemplateDocument,
  profileData: Record<string, unknown> = {},
): DerivedField[] {
  const fields: DerivedField[] = [];
  const seenFieldIds = new Set<string>();
  const seenSources = new Set<DataSourceKey>();

  const collect = (line: TemplateLine | undefined) => {
    if (!line || line.enabled === false) return;
    for (const field of line.fields) {
      if (field.value.kind === 'manual-template') {
        if (seenFieldIds.has(field.id)) continue;
        seenFieldIds.add(field.id);
        fields.push({
          fieldId: field.id,
          labelKey: field.id,
          kind: 'manual',
          value: field.value.value || null,
          provenance: 'template',
        });
        continue;
      }

      const source = field.value.source;
      const profileKey = PROFILE_SOURCE_TO_PROFILE_KEY[source];
      if (!profileKey) continue;
      if (seenSources.has(source)) continue;
      seenSources.add(source);

      const raw = profileData[profileKey];
      const value = typeof raw === 'string' && raw.trim() !== '' ? raw : null;
      fields.push({
        fieldId: field.id,
        labelKey: source,
        kind: 'bound',
        source,
        value,
        provenance: value ? 'profile' : 'gap',
      });
    }
  };

  collect(document.header.orgIdentityLine);
  for (const metaLine of document.header.metaLines) collect(metaLine);
  for (const block of document.blocks) {
    if (block.kind === 'table') continue;
    if (block.kind === 'note') {
      collect(block.line);
    } else if (block.enabled !== false) {
      for (const line of block.lines) collect(line);
    }
  }
  collect(document.footer.closingLine);

  return fields;
}
