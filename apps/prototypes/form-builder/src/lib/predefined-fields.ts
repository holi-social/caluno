import type { FieldType } from './types';

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
  text: 'Text',
  vorname: 'Vorname',
  nachname: 'Nachname',
  email: 'E-Mail',
  phone: 'Telefon',
  date: 'Datum',
  iban: 'IBAN',
  plz: 'PLZ',
  password: 'Passwort',
  numbers: 'Zahlen',
  textarea: 'Textfeld',
  select: 'Dropdown',
  checkbox: 'Checkbox',
  multichoice: 'Mehrfachauswahl',
  singlechoice: 'Einzelauswahl',
  'document-acknowledgement': 'Dokument',
};

/** Field types offered in the builder's field-type picker, in display order. */
export const FIELD_TYPE_OPTIONS: { label: string; value: FieldType }[] = [
  { label: 'Vorname', value: 'vorname' },
  { label: 'Nachname', value: 'nachname' },
  { label: 'Eingabe', value: 'text' },
  { label: 'E-Mail', value: 'email' },
  { label: 'Telefonnummer', value: 'phone' },
  { label: 'Zahlen', value: 'numbers' },
  { label: 'Mehrfachauswahl', value: 'multichoice' },
  { label: 'Einzelauswahl', value: 'singlechoice' },
  { label: 'Datum', value: 'date' },
  { label: 'Dokument zum Akzeptieren', value: 'document-acknowledgement' },
];
