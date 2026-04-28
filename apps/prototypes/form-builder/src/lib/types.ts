export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'textarea'
  | 'document-acknowledgement'
  | 'password'
  | 'multichoice'
  | 'singlechoice'
  | 'numbers'
  | 'iban'
  | 'plz';

export type SelectOption = {
  label: string;
  value: string;
};

export type FormField = {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  /**
   * If true, the field's type is not editable in the builder UI.
   * Used for predefined fields (e.g. "Vorname", "Nachname", ...)
   */
  lockType?: boolean;
  options?: SelectOption[];
  documentUrl?: string;
  documentLabel?: string;
  minAge?: number;
};

export type FormSection = {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  fields: FormField[];
  locked?: boolean;
  lockedSource?: string;
};

export type FormSettings = {
  submitButtonLabel: string;
  successTitle: string;
  successMessage: string;
  allowEmbed: boolean;
};

export type FormConfig = {
  id: string;
  slug: string;
  name: string;
  description: string;
  organizationName: string;
  locale: 'de' | 'en';
  sections: FormSection[];
  settings: FormSettings;
  createdAt: string;
  updatedAt: string;
};

export type FormSubmission = {
  id: string;
  formConfigId: string;
  formSlug: string;
  data: Record<string, string | boolean | string[]>;
  submittedAt: string;
};

export type FieldError = {
  fieldId: string;
  message: string;
};
