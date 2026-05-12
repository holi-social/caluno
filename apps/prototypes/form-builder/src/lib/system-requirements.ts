import type { FieldType, FormField, SelectOption } from './types';

/**
 * Platform-defined preset fields whose answers live on the user profile,
 * not on the form submission. Reusable across sub-orgs (and, in future,
 * organizations). The org can only override label/description per block;
 * type, options, and the required-flag policy come from the registry.
 *
 * Required-flag policy is two-dimensional:
 *  - `defaultRequired` — the initial value of `field.required` at creation.
 *  - `requiredEditable` — whether the org can flip the toggle in the
 *    builder. When false, the Switch is rendered disabled.
 */
export type SystemRequirementKey =
  | 'nachname'
  | 'vorname'
  | 'bevorzugter-name'
  | 'geschlecht'
  | 'email'
  | 'telefonnummer'
  | 'adresse'
  | 'plz'
  | 'stadt'
  | 'geburtsdatum';

export type SystemRequirementPreset = {
  key: SystemRequirementKey;
  defaultLabel: string;
  defaultDescription?: string;
  type: FieldType;
  defaultRequired: boolean;
  requiredEditable: boolean;
  minAge?: number;
  options?: SelectOption[];
};

export const SYSTEM_REQUIREMENTS: Record<
  SystemRequirementKey,
  SystemRequirementPreset
> = {
  nachname: {
    key: 'nachname',
    defaultLabel: 'Nachname',
    defaultDescription: 'Wie im Ausweisdokument.',
    type: 'nachname',
    defaultRequired: true,
    requiredEditable: false,
  },
  vorname: {
    key: 'vorname',
    defaultLabel: 'Vorname',
    defaultDescription: 'Wie im Ausweisdokument.',
    type: 'vorname',
    defaultRequired: true,
    requiredEditable: false,
  },
  'bevorzugter-name': {
    key: 'bevorzugter-name',
    defaultLabel: 'Bevorzugter Name',
    defaultDescription: 'Falls anders als der gesetzliche Name.',
    type: 'vorname',
    defaultRequired: false,
    requiredEditable: false,
  },
  geschlecht: {
    key: 'geschlecht',
    defaultLabel: 'Geschlecht',
    type: 'singlechoice',
    defaultRequired: false,
    requiredEditable: true,
    options: [
      { label: 'Weiblich', value: 'weiblich' },
      { label: 'Männlich', value: 'maennlich' },
      { label: 'Divers', value: 'divers' },
    ],
  },
  email: {
    key: 'email',
    defaultLabel: 'E-Mail',
    type: 'email',
    defaultRequired: true,
    requiredEditable: false,
  },
  telefonnummer: {
    key: 'telefonnummer',
    defaultLabel: 'Telefonnummer',
    type: 'phone',
    defaultRequired: false,
    requiredEditable: true,
  },
  adresse: {
    key: 'adresse',
    defaultLabel: 'Adresse',
    type: 'text',
    defaultRequired: true,
    requiredEditable: true,
  },
  plz: {
    key: 'plz',
    defaultLabel: 'PLZ',
    type: 'plz',
    defaultRequired: true,
    requiredEditable: true,
  },
  stadt: {
    key: 'stadt',
    defaultLabel: 'Stadt',
    type: 'text',
    defaultRequired: true,
    requiredEditable: true,
  },
  geburtsdatum: {
    key: 'geburtsdatum',
    defaultLabel: 'Geburtsdatum',
    defaultDescription:
      'Wird im Profil gespeichert und z.B. fuer altersgebundene Einsaetze genutzt.',
    type: 'date',
    defaultRequired: true,
    requiredEditable: false,
  },
};

/** All registry entries, in display order. */
export const SYSTEM_REQUIREMENT_LIST: SystemRequirementPreset[] =
  Object.values(SYSTEM_REQUIREMENTS);

export function createSystemRequirementField(
  key: SystemRequirementKey,
): FormField {
  const preset = SYSTEM_REQUIREMENTS[key];
  const field: FormField = {
    id: `sysreq-${key}-${Math.random().toString(36).slice(2, 8)}`,
    type: preset.type,
    label: preset.defaultLabel,
    required: preset.defaultRequired,
    lockType: true,
    systemKey: key,
  };
  if (preset.defaultDescription) field.description = preset.defaultDescription;
  if (preset.minAge !== undefined) field.minAge = preset.minAge;
  if (preset.options) field.options = preset.options;
  return field;
}

export function isSystemRequirement(field: FormField): boolean {
  return typeof field.systemKey === 'string' && field.systemKey.length > 0;
}

export function getSystemRequirementPreset(
  field: FormField,
): SystemRequirementPreset | null {
  if (!field.systemKey) return null;
  if (!(field.systemKey in SYSTEM_REQUIREMENTS)) return null;
  return SYSTEM_REQUIREMENTS[field.systemKey as SystemRequirementKey];
}

export function getSystemRequirementKeysInUse(
  fields: FormField[],
): Set<SystemRequirementKey> {
  const used = new Set<SystemRequirementKey>();
  for (const f of fields) {
    if (f.systemKey && f.systemKey in SYSTEM_REQUIREMENTS) {
      used.add(f.systemKey as SystemRequirementKey);
    }
  }
  return used;
}
