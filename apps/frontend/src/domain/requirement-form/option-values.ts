import { z } from 'zod';

/**
 * Choice-field options render one control per value; an empty value can never
 * stay selected on the volunteer form, so label and value must be non-empty.
 */
export const choiceOptionSchema = z.object({
  label: z.string().trim().min(1, 'Option label is required'),
  value: z.string().trim().min(1, 'Option value is required'),
});

/** Mirror the label into the value while no explicit value is set. */
export const deriveOptionValue = (label: string, value: string): string =>
  value.trim() === '' ? label : value;

/**
 * MULTI_CHOICE selections travel through the GraphQL `String` value channel as
 * a JSON-encoded array; commas in option values stay intact. Reads tolerate the
 * legacy comma-joined format (pre-refactor clients and in-flight submissions).
 */
export const serializeMultiChoiceValue = (values: string[]): string =>
  JSON.stringify(values);

export const parseMultiChoiceValue = (raw: string): string[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === 'string');
    }
  } catch {
    // legacy comma-joined format — fall through
  }
  return raw.split(',');
};
