import z from 'zod';

/** Whitespace-only → null (explicit DB clear). Otherwise trimmed text. */
export function nullableTrimmedText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** undefined = omit from patch; string = trim, empty → null. */
export function optionalNullableTrimmedText(
  value: string | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  return nullableTrimmedText(value);
}

export const zOptionalNullableTrimmedString = z
  .string()
  .optional()
  .transform((value) => optionalNullableTrimmedText(value));

export const zNullableTrimmedString = z.string().transform(nullableTrimmedText);
