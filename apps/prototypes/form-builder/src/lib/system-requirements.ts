import type { FieldType, FormField, SelectOption } from './types';

/**
 * Platform-defined preset fields whose answers live on the user profile,
 * not on the form submission. Reusable across sub-orgs (and, in future,
 * organizations). The org can only override label/description per block;
 * type, validation, required, options come from the registry.
 */
export type SystemRequirementKey = 'geburtsdatum';

export type SystemRequirementPreset = {
  key: SystemRequirementKey;
  defaultLabel: string;
  defaultDescription: string;
  type: FieldType;
  required: true;
  minAge?: number;
  options?: SelectOption[];
};

export const SYSTEM_REQUIREMENTS: Record<
  SystemRequirementKey,
  SystemRequirementPreset
> = {
  geburtsdatum: {
    key: 'geburtsdatum',
    defaultLabel: 'Geburtsdatum',
    defaultDescription:
      'Wird im Profil gespeichert und z.B. für altersgebundene Einsätze genutzt.',
    type: 'date',
    required: true,
  },
};

/** All registry entries, in display order. */
export const SYSTEM_REQUIREMENT_LIST: SystemRequirementPreset[] =
  Object.values(SYSTEM_REQUIREMENTS);

export function createSystemRequirementField(
  key: SystemRequirementKey,
): FormField {
  const preset = SYSTEM_REQUIREMENTS[key];
  return {
    id: `sysreq-${key}-${Math.random().toString(36).slice(2, 8)}`,
    type: preset.type,
    label: preset.defaultLabel,
    description: preset.defaultDescription,
    required: preset.required,
    lockType: true,
    systemKey: key,
    ...(preset.minAge !== undefined ? { minAge: preset.minAge } : {}),
    ...(preset.options ? { options: preset.options } : {}),
  };
}

export function isSystemRequirement(field: FormField): boolean {
  return typeof field.systemKey === 'string' && field.systemKey.length > 0;
}

export function getSystemRequirementKeysInUse(
  fields: FormField[],
): Set<SystemRequirementKey> {
  const used = new Set<SystemRequirementKey>();
  for (const f of fields) {
    if (f.systemKey && f.systemKey in SYSTEM_REQUIREMENTS) {
      used.add(f.systemKey as SystemRequirementKey);
    }
  }
  return used;
}
