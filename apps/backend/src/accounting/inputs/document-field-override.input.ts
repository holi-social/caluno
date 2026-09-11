import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class DocumentFieldOverrideInput {
  @Field()
  fieldId!: string;

  @Field()
  value!: string;
}

export function toFieldOverridesMap(
  overrides?: DocumentFieldOverrideInput[] | null,
): Record<string, string> {
  return Object.fromEntries(
    (overrides ?? []).map((override) => [override.fieldId, override.value]),
  );
}
