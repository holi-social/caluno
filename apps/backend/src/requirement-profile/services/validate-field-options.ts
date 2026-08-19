import { BadRequestGraphQLError } from '../../graphql/errors';
import { FieldType } from '../enums';

const CHOICE_TYPES: ReadonlySet<FieldType> = new Set([
  FieldType.SINGLE_CHOICE,
  FieldType.MULTI_CHOICE,
]);

export interface FieldOptionInput {
  label: string;
  value: string;
}

/**
 * Choice fields render one control per option value; an empty value can never
 * stay selected on the volunteer form, so reject it at write time.
 */
export function assertValidFieldOptions(
  type: FieldType,
  options: FieldOptionInput[] | null | undefined,
): void {
  if (!CHOICE_TYPES.has(type) || !options) return;

  for (const option of options) {
    if (!option.label?.trim() || !option.value?.trim()) {
      throw new BadRequestGraphQLError(
        'Choice field options must have a non-empty label and value',
      );
    }
  }
}
