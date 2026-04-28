import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { FormConfig } from './types';
import { PRESET_SECTION_FIELD_LABELS } from './predefined-fields';

function normalizeConfig(config: FormConfig): FormConfig {
  return {
    ...config,
    sections: config.sections.map((section) => {
      const presetLabels = PRESET_SECTION_FIELD_LABELS.get(section.title);
      if (!presetLabels) return section;
      return {
        ...section,
        fields: section.fields.map((field) => {
          if (field.lockType === true) return field;
          if (!presetLabels.has(field.label)) return field;
          return { ...field, lockType: true };
        }),
      };
    }),
  };
}

function jsonPath(): string {
  return path.join(process.cwd(), 'data', 'form-configs.json');
}

async function readConfigs(): Promise<FormConfig[]> {
  const file = jsonPath();
  try {
    const raw = await readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as FormConfig[]).map(normalizeConfig);
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      await seedConfigs();
      const raw = await readFile(file, 'utf8');
      return (JSON.parse(raw) as FormConfig[]).map(normalizeConfig);
    }
    throw e;
  }
}

async function writeConfigs(configs: FormConfig[]): Promise<void> {
  const file = jsonPath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(configs, null, 2)}\n`, 'utf8');
}

async function seedConfigs(): Promise<void> {
  await writeConfigs([]);
}

let chain: Promise<unknown> = Promise.resolve();

function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export async function listFormConfigs(): Promise<FormConfig[]> {
  return runExclusive(async () => {
    return readConfigs();
  });
}

export async function getFormConfig(
  slug: string,
): Promise<FormConfig | null> {
  return runExclusive(async () => {
    const configs = await readConfigs();
    return configs.find((c) => c.slug === slug) ?? null;
  });
}

export async function updateFormConfig(
  slug: string,
  data: Partial<Omit<FormConfig, 'id' | 'slug' | 'createdAt'>>,
): Promise<FormConfig | null> {
  return runExclusive(async () => {
    const configs = await readConfigs();
    const idx = configs.findIndex((c) => c.slug === slug);
    if (idx === -1) return null;

    const existing = configs[idx]!;
    const updated: FormConfig = {
      ...existing,
      ...data,
      id: existing.id,
      slug: existing.slug,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    configs[idx] = updated;
    await writeConfigs(configs);
    return updated;
  });
}

function generateSlug(name: string, existing: FormConfig[]): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const slugBase = base || 'formular';
  const taken = new Set(existing.map((c) => c.slug));
  if (!taken.has(slugBase)) return slugBase;
  let i = 2;
  while (taken.has(`${slugBase}-${i}`)) i++;
  return `${slugBase}-${i}`;
}

export async function deleteFormConfig(slug: string): Promise<boolean> {
  return runExclusive(async () => {
    const configs = await readConfigs();
    const idx = configs.findIndex((c) => c.slug === slug);
    if (idx === -1) return false;
    configs.splice(idx, 1);
    await writeConfigs(configs);
    return true;
  });
}

export async function createFormConfig(data: {
  name: string;
  organizationName: string;
  description?: string;
}): Promise<FormConfig> {
  return runExclusive(async () => {
    const configs = await readConfigs();
    const now = new Date().toISOString();
    const newConfig: FormConfig = {
      id: randomUUID(),
      slug: generateSlug(data.name, configs),
      name: data.name,
      description: data.description ?? '',
      organizationName: data.organizationName,
      locale: 'de',
      sections: [],
      settings: {
        submitButtonLabel: 'Absenden',
        successTitle: 'Vielen Dank!',
        successMessage: 'Ihre Daten wurden erfolgreich übermittelt.',
        allowEmbed: true,
      },
      createdAt: now,
      updatedAt: now,
    };
    configs.push(newConfig);
    await writeConfigs(configs);
    return newConfig;
  });
}
