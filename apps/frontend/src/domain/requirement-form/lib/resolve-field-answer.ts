import { parseMultiChoiceValue } from '../option-values';

export type SubmissionField = {
  id: string;
  label: string;
  type: string;
  systemKey?: string | null;
  options?: { label: string; value: string }[] | null;
};

export type SubmissionValue = { fieldId: string; value: string };

export type ResolveFieldAnswerOptions = {
  dash: string;
  accepted: string;
  formatDate: (date: Date) => string;
};

export function resolveFieldAnswer(
  field: SubmissionField,
  submissionValues: SubmissionValue[],
  profileData: Record<string, unknown>,
  { dash, accepted, formatDate }: ResolveFieldAnswerOptions,
): string {
  const raw =
    field.systemKey && profileData[field.systemKey] !== undefined
      ? String(profileData[field.systemKey])
      : (submissionValues.find((v) => v.fieldId === field.id)?.value ?? null);

  if (!raw) {
    return dash;
  }

  if (field.type === 'DATE') {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? raw : formatDate(d);
  }
  if (field.type === 'CHECKBOX' || field.type === 'DOCUMENT_ACKNOWLEDGEMENT') {
    return raw === 'true' ? accepted : dash;
  }
  if (field.type === 'MULTI_CHOICE') {
    const options = field.options ?? [];
    return parseMultiChoiceValue(raw)
      .map((v) => options.find((o) => o.value === v)?.label ?? v)
      .join(', ');
  }
  if (field.type === 'STATIC_TEXT') return dash;

  return raw;
}
