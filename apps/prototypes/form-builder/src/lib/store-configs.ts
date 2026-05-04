import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { FormConfig } from './types';
import { getUserById } from './users';
import { SEED_BLOCK_IDS } from './store-blocks';

function jsonPath(): string {
  return path.join(process.cwd(), 'data', 'form-configs.json');
}

async function readConfigs(): Promise<FormConfig[]> {
  const file = jsonPath();
  try {
    const raw = await readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as FormConfig[];
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      await seedConfigs();
      const raw = await readFile(file, 'utf8');
      return JSON.parse(raw) as FormConfig[];
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
  const now = new Date().toISOString();
  const sampleForm: FormConfig = {
    id: randomUUID(),
    slug: 'onboarding-ehrenamt',
    name: 'Onboarding Ehrenamt',
    description: 'Registrierungsformular fuer neue Ehrenamtliche',
    organizationName: 'Abteilung EA',
    locale: 'de',
    blockRefs: [
      { blockId: SEED_BLOCK_IDS.personal, order: 0, required: true },
      { blockId: SEED_BLOCK_IDS.kontakte, order: 1, required: true },
      { blockId: SEED_BLOCK_IDS.adresse, order: 2 },
      { blockId: SEED_BLOCK_IDS.datenschutz, order: 3, required: true },
    ],
    appliedTo: ['join-org'],
    settings: {
      submitButtonLabel: 'Absenden',
      successTitle: 'Vielen Dank!',
      successMessage: 'Ihre Daten wurden erfolgreich uebermittelt.',
      allowEmbed: true,
    },
    createdBy: 'andrea',
    updatedBy: 'andrea',
    createdAt: now,
    updatedAt: now,
  };
  await writeConfigs([sampleForm]);
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

// --- Public API ---

export async function listFormConfigs(): Promise<FormConfig[]> {
  return runExclusive(() => readConfigs());
}

export async function getFormConfig(
  slug: string,
): Promise<FormConfig | null> {
  return runExclusive(async () => {
    const configs = await readConfigs();
    return configs.find((c) => c.slug === slug) ?? null;
  });
}

export async function createFormConfig(data: {
  name: string;
  description?: string;
  createdBy: string;
}): Promise<FormConfig> {
  return runExclusive(async () => {
    const configs = await readConfigs();
    const user = getUserById(data.createdBy);
    const now = new Date().toISOString();
    const newConfig: FormConfig = {
      id: randomUUID(),
      slug: generateSlug(data.name, configs),
      name: data.name,
      description: data.description ?? '',
      organizationName: user?.subOrg ?? '',
      locale: 'de',
      blockRefs: [],
      appliedTo: [],
      settings: {
        submitButtonLabel: 'Absenden',
        successTitle: 'Vielen Dank!',
        successMessage: 'Ihre Daten wurden erfolgreich uebermittelt.',
        allowEmbed: true,
      },
      createdBy: data.createdBy,
      updatedBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    configs.push(newConfig);
    await writeConfigs(configs);
    return newConfig;
  });
}

export async function updateFormConfig(
  slug: string,
  data: Partial<Omit<FormConfig, 'id' | 'slug' | 'createdAt' | 'createdBy'>>,
  updatedBy: string,
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
      createdBy: existing.createdBy,
      updatedBy,
      updatedAt: new Date().toISOString(),
    };
    configs[idx] = updated;
    await writeConfigs(configs);
    return updated;
  });
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

export async function copyFormConfig(
  sourceSlug: string,
  newName: string,
  createdBy: string,
): Promise<FormConfig | null> {
  return runExclusive(async () => {
    const configs = await readConfigs();
    const source = configs.find((c) => c.slug === sourceSlug);
    if (!source) return null;

    const user = getUserById(createdBy);
    const now = new Date().toISOString();
    const copy: FormConfig = {
      id: randomUUID(),
      slug: generateSlug(newName, configs),
      name: newName,
      description: source.description,
      organizationName: user?.subOrg ?? '',
      locale: source.locale,
      blockRefs: source.blockRefs.map((ref) => ({ ...ref })),
      appliedTo: [...source.appliedTo],
      settings: { ...source.settings },
      createdBy,
      updatedBy: createdBy,
      createdAt: now,
      updatedAt: now,
    };
    configs.push(copy);
    await writeConfigs(configs);
    return copy;
  });
}
