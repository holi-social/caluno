import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Entry } from './types';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'entries.json');

function readEntries(): Entry[] {
  if (!existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8')) as Entry[];
  } catch {
    return [];
  }
}

function writeEntries(entries: Entry[]): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

export function createEntry(
  data: Pick<Entry, 'action'>,
): Entry {
  const entries = readEntries();
  const entry: Entry = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  entries.push(entry);
  writeEntries(entries);
  return entry;
}

export function updateEntry(
  id: string,
  data: Partial<Omit<Entry, 'id' | 'createdAt'>>,
): Entry | null {
  const entries = readEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const existing = entries[idx];
  if (!existing) return null;
  entries[idx] = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writeEntries(entries);
  return entries[idx] ?? null;
}
