export type ChangedFieldKind = 'value' | 'text';

export interface ChangedField {
  /** i18n key fragment under the template's `change.` namespace. */
  field: string;
  kind: ChangedFieldKind;
  /** For `value` fields — the previous value (formatted by the template). */
  previous?: string | null;
  /** For `value` fields — the new value (formatted by the template). */
  current?: string | null;
  /** For `text` fields — the current text (the previous text is not sent). */
  text?: string | null;
}

export interface ShiftDetailsChangedPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  /** One mail per series edit, listing the affected range. */
  fromDate?: Date | null;
  /** Volunteers with an active invite, excluding the actor. */
  recipientUserIds: string[];
  changes: ChangedField[];
}
