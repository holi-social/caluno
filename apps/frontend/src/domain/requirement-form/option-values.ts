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
