import type { FieldType, FormField } from './types';

export type PredefinedFieldKey =
  | 'name'
  | 'vorname'
  | 'dob'
  | 'street'
  | 'plz'
  | 'city'
  | 'email'
  | 'phone'
  | 'iban'
  | 'paymentDate'
  | 'datenschutz'
  | 'vereinbarung'
  | 'handbuch';

type PredefinedFieldDef = Omit<FormField, 'id'> & { lockType: true };

const PREDEFINED_FIELDS: Record<PredefinedFieldKey, PredefinedFieldDef> = {
  name: {
    type: 'text',
    label: 'Name',
    placeholder: 'z.B. Mustermann',
    required: true,
    lockType: true,
  },
  vorname: {
    type: 'text',
    label: 'Vorname',
    placeholder: 'z.B. Max',
    required: true,
    lockType: true,
  },
  dob: {
    type: 'date',
    label: 'Geburtsdatum',
    required: true,
    minAge: 14,
    lockType: true,
  },
  street: {
    type: 'text',
    label: 'Straße und Hausnummer',
    placeholder: 'z.B. Musterstraße 42',
    required: true,
    lockType: true,
  },
  plz: {
    type: 'plz',
    label: 'PLZ',
    placeholder: 'z.B. 10115',
    required: true,
    lockType: true,
  },
  city: {
    type: 'text',
    label: 'Stadt',
    placeholder: 'z.B. Berlin',
    required: true,
    lockType: true,
  },
  email: {
    type: 'email',
    label: 'E-Mail',
    placeholder: 'z.B. max@beispiel.de',
    required: true,
    lockType: true,
  },
  phone: {
    type: 'phone',
    label: 'Telefonnummer',
    placeholder: 'z.B. +49 170 1234567',
    required: true,
    lockType: true,
  },
  iban: {
    type: 'iban',
    label: 'IBAN',
    placeholder: 'z.B. DE89 3704 0044 0532 0130 00',
    required: true,
    lockType: true,
  },
  paymentDate: {
    type: 'date',
    label: 'Zahlungsdatum',
    required: true,
    lockType: true,
  },
  datenschutz: {
    type: 'document-acknowledgement',
    label: 'Datenschutzerklärung',
    required: true,
    documentLabel: 'Bitte lesen und akzeptieren Sie die Datenschutzerklärung.',
    lockType: true,
  },
  vereinbarung: {
    type: 'document-acknowledgement',
    label: 'Vereinbarung',
    required: true,
    documentLabel: 'Bitte lesen und akzeptieren Sie die Vereinbarung.',
    lockType: true,
  },
  handbuch: {
    type: 'document-acknowledgement',
    label: 'Handbuch',
    required: false,
    documentLabel: 'Bitte lesen Sie das Handbuch.',
    lockType: true,
  },
};

export function getPredefinedField(key: PredefinedFieldKey): Omit<FormField, 'id'> {
  return { ...PREDEFINED_FIELDS[key] };
}

/** All predefined field keys available for the add-field dialog dropdown. */
export const PREDEFINED_FIELD_OPTIONS: { key: PredefinedFieldKey; label: string }[] = [
  { key: 'vorname', label: 'Vorname' },
  { key: 'name', label: 'Nachname' },
  { key: 'dob', label: 'Geburtsdatum' },
  { key: 'street', label: 'Straße und Hausnummer' },
  { key: 'plz', label: 'PLZ' },
  { key: 'city', label: 'Stadt' },
  { key: 'iban', label: 'IBAN' },
];

export type PresetSection = {
  title: string;
  icon?: string;
  fieldKeys: PredefinedFieldKey[];
};

export const PRESET_SECTIONS: PresetSection[] = [
  { title: 'Persönliche Daten', icon: 'User', fieldKeys: ['name', 'vorname'] },
  { title: 'Kontakte', icon: 'User', fieldKeys: ['email', 'phone'] },
  { title: 'Bankdaten', icon: 'Banknote', fieldKeys: ['iban', 'paymentDate'] },
  { title: 'Datenschutzerklärung', icon: 'FileCheck', fieldKeys: ['datenschutz'] },
  { title: 'Vereinbarung', icon: 'FileCheck', fieldKeys: ['vereinbarung'] },
  { title: 'Handbuch', icon: 'FileCheck', fieldKeys: ['handbuch'] },
];

/** Set of all predefined field labels, used by store-configs to normalize lockType on load. */
export const PREDEFINED_FIELD_LABELS: Set<string> = new Set(
  Object.values(PREDEFINED_FIELDS).map((f) => f.label),
);

/** Map of section title → set of predefined field labels in that section. */
export const PRESET_SECTION_FIELD_LABELS: Map<string, Set<string>> = new Map(
  PRESET_SECTIONS.map((s) => [
    s.title,
    new Set(s.fieldKeys.map((k) => PREDEFINED_FIELDS[k].label)),
  ]),
);

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text',
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
