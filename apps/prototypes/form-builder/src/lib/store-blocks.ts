import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { Block, FormField } from './types';

function jsonPath(): string {
  return path.join(process.cwd(), 'data', 'blocks.json');
}

async function readBlocks(): Promise<Block[]> {
  const file = jsonPath();
  try {
    const raw = await readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as Block[];
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      await seedBlocks();
      const raw = await readFile(file, 'utf8');
      return JSON.parse(raw) as Block[];
    }
    throw e;
  }
}

async function writeBlocks(blocks: Block[]): Promise<void> {
  const file = jsonPath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(blocks, null, 2)}\n`, 'utf8');
}

// --- Seed data ---

const SEED_BLOCK_IDS = {
  personal: 'seed-block-personal',
  kontakte: 'seed-block-kontakte',
  adresse: 'seed-block-adresse',
  datenschutz: 'seed-block-datenschutz',
};

function makeSeedField(
  id: string,
  label: string,
  type: FormField['type'],
  extra?: Partial<FormField>,
): FormField {
  return {
    id,
    type,
    label,
    required: true,
    ...extra,
  };
}

async function seedBlocks(): Promise<void> {
  const now = new Date().toISOString();
  const base = {
    createdBy: 'andrea',
    updatedBy: 'andrea',
    createdAt: now,
    updatedAt: now,
  };

  const blocks: Block[] = [
    {
      id: SEED_BLOCK_IDS.personal,
      title: 'Persoenliche Daten',
      icon: 'User',
      fields: [
        makeSeedField('f-vorname', 'Vorname', 'text', {
          placeholder: 'z.B. Max',
        }),
        makeSeedField('f-nachname', 'Nachname', 'text', {
          placeholder: 'z.B. Mustermann',
        }),
        makeSeedField('f-dob', 'Geburtsdatum', 'date', { minAge: 14 }),
      ],
      required: true,
      ...base,
    },
    {
      id: SEED_BLOCK_IDS.kontakte,
      title: 'Kontakte',
      icon: 'User',
      fields: [
        makeSeedField('f-email', 'E-Mail', 'email', {
          placeholder: 'z.B. max@beispiel.de',
        }),
        makeSeedField('f-phone', 'Telefonnummer', 'phone', {
          placeholder: 'z.B. +49 170 1234567',
        }),
      ],
      required: true,
      ...base,
    },
    {
      id: SEED_BLOCK_IDS.adresse,
      title: 'Adresse',
      icon: 'MapPin',
      fields: [
        makeSeedField('f-street', 'Strasse und Hausnummer', 'text', {
          placeholder: 'z.B. Musterstrasse 42',
        }),
        makeSeedField('f-plz', 'PLZ', 'plz', {
          placeholder: 'z.B. 10115',
        }),
        makeSeedField('f-city', 'Stadt', 'text', {
          placeholder: 'z.B. Berlin',
        }),
      ],
      required: true,
      ...base,
    },
    {
      id: SEED_BLOCK_IDS.datenschutz,
      title: 'Datenschutzerklärung',
      icon: 'FileCheck',
      fields: [
        makeSeedField('f-datenschutz', 'Datenschutzerklärung', 'document-acknowledgement', {
          documentLabel:
            'Bitte lesen und akzeptieren Sie die Datenschutzerklärung.',
        }),
      ],
      required: true,
      ...base,
    },
  ];

  await writeBlocks(blocks);
}

export { SEED_BLOCK_IDS };

// --- Concurrency guard ---

let chain: Promise<unknown> = Promise.resolve();

function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

// --- Public API ---

export async function listBlocks(): Promise<Block[]> {
  return runExclusive(() => readBlocks());
}

export async function getBlock(id: string): Promise<Block | null> {
  return runExclusive(async () => {
    const blocks = await readBlocks();
    return blocks.find((b) => b.id === id) ?? null;
  });
}

export async function getBlocksByIds(ids: string[]): Promise<Block[]> {
  return runExclusive(async () => {
    const blocks = await readBlocks();
    const idSet = new Set(ids);
    return blocks.filter((b) => idSet.has(b.id));
  });
}

export async function createBlock(data: {
  title: string;
  description?: string;
  icon?: string;
  fields: FormField[];
  required: boolean;
  createdBy: string;
}): Promise<Block> {
  return runExclusive(async () => {
    const blocks = await readBlocks();
    const now = new Date().toISOString();
    const block: Block = {
      id: `block-${randomUUID().slice(0, 8)}`,
      title: data.title,
      description: data.description,
      icon: data.icon,
      fields: data.fields,
      required: data.required,
      createdBy: data.createdBy,
      updatedBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    blocks.push(block);
    await writeBlocks(blocks);
    return block;
  });
}

export async function updateBlock(
  id: string,
  data: Partial<Omit<Block, 'id' | 'createdAt' | 'createdBy'>>,
  updatedBy: string,
): Promise<Block | null> {
  return runExclusive(async () => {
    const blocks = await readBlocks();
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return null;

    const existing = blocks[idx]!;
    const updated: Block = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      createdBy: existing.createdBy,
      updatedBy,
      updatedAt: new Date().toISOString(),
    };
    blocks[idx] = updated;
    await writeBlocks(blocks);
    return updated;
  });
}

export async function deleteBlock(id: string): Promise<boolean> {
  return runExclusive(async () => {
    const blocks = await readBlocks();
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    blocks.splice(idx, 1);
    await writeBlocks(blocks);
    return true;
  });
}
