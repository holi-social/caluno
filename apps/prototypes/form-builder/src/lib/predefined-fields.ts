import type { FieldType, FormField } from './types';

/** Label to display for a field in chip/badge contexts.
 *  For `static-text` we hide the content (which lives in `field.label`)
 *  behind a placeholder so block previews stay readable. */
export function getFieldDisplayLabel(field: FormField): string {
  return field.type === 'static-text' ? 'Hinweistext' : field.label;
}

// --- Predefined field presets (commented out — block architecture uses custom fields) ---

// export type PredefinedFieldKey =
//   | 'name'
//   | 'vorname'
//   | 'dob'
//   | 'street'
//   | 'plz'
//   | 'city'
//   | 'email'
//   | 'phone'
//   | 'iban'
//   | 'paymentDate'
//   | 'datenschutz'
//   | 'vereinbarung'
//   | 'handbuch';

// type PredefinedFieldDef = Omit<FormField, 'id'> & { lockType: true };
// const PREDEFINED_FIELDS: Record<PredefinedFieldKey, PredefinedFieldDef> = { ... };
// export function getPredefinedField(key: PredefinedFieldKey): Omit<FormField, 'id'> { ... }
// export const PREDEFINED_FIELD_OPTIONS: { key: PredefinedFieldKey; label: string }[] = [ ... ];

// --- Preset sections (commented out — blocks replace sections) ---

// export type PresetSection = { title: string; icon?: string; fieldKeys: PredefinedFieldKey[] };
// export const PRESET_SECTIONS: PresetSection[] = [ ... ];
// export const PREDEFINED_FIELD_LABELS: Set<string> = new Set( ... );
// export const PRESET_SECTION_FIELD_LABELS: Map<string, Set<string>> = new Map( ... );

// --- Field type labels (still used by builder UI) ---

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Eingabe (kurz)',
  vorname: 'Vorname',
  nachname: 'Nachname',
  email: 'E-Mail',
  phone: 'Telefon',
  date: 'Datum',
  iban: 'IBAN',
  plz: 'PLZ',
  password: 'Passwort',
  numbers: 'Zahlen',
  textarea: 'Eingabe (lang)',
  select: 'Dropdown',
  checkbox: 'Checkbox',
  multichoice: 'Mehrfachauswahl',
  singlechoice: 'Dropdown',
  'document-acknowledgement': 'Dokument',
  'static-text': 'Hinweistext',
};

/** Field types offered in the builder's field-type picker, in display order.
 *  Grouped: free-text inputs → typed value inputs → selection inputs → special.
 *  System-bound types (vorname, email, phone, ...) are intentionally excluded —
 *  those reach a block via the system-field flow, not the custom-field picker. */
export const FIELD_TYPE_OPTIONS: { label: string; value: FieldType }[] = [
  { label: 'Eingabe (kurz)', value: 'text' },
  { label: 'Eingabe (lang)', value: 'textarea' },
  { label: 'Zahlen', value: 'numbers' },
  { label: 'Datum', value: 'date' },
  { label: 'Dropdown', value: 'singlechoice' },
  { label: 'Mehrfachauswahl', value: 'multichoice' },
  { label: 'Dokument zum Akzeptieren', value: 'document-acknowledgement' },
  { label: 'Hinweistext', value: 'static-text' },
];
