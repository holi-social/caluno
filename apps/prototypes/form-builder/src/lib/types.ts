export type FieldType =
  | 'text'
  | 'vorname'
  | 'nachname'
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

// --- Block-based architecture ---

export type Block = {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  fields: FormField[];
  /** Default required-ness for the whole block (all fields). */
  required: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type BlockRef = {
  blockId: string;
  order: number;
  /** Per-form override of block's default required value. undefined = use block default. */
  required?: boolean;
};

/** Block with resolved effective required-ness for rendering. */
export type ResolvedBlock = Block & {
  effectiveRequired: boolean;
};

// --- Form config ---

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
  blockRefs: BlockRef[];
  settings: FormSettings;
  createdBy: string;
  updatedBy: string;
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

// --- Legacy (kept for reference) ---
// export type FormSection = {
//   id: string;
//   title: string;
//   description?: string;
//   icon?: string;
//   fields: FormField[];
//   locked?: boolean;
//   lockedSource?: string;
// };
