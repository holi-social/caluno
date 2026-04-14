import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Action, Entry } from './types';

const ACTIONS: Action[] = ['starting', 'finishing', 'break'];

function isAction(v: unknown): v is Action {
  return typeof v === 'string' && ACTIONS.includes(v as Action);
}

function jsonPath(): string {
  const fromEnv = process.env.HELP_EXPERIMENT_JSON_PATH?.trim();
  if (fromEnv) return path.isAbsolute(fromEnv) ? fromEnv : path.join(process.cwd(), fromEnv);
  return path.join(process.cwd(), 'data', 'entries.json');
}

function isEntryRecord(v: unknown): v is Entry {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    isAction(o.action) &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string'
  );
}

async function readEntries(): Promise<Entry[]> {
  const file = jsonPath();
  try {
    const raw = await readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntryRecord);
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') return [];
    throw e;
  }
}

async function writeEntries(entries: Entry[]): Promise<void> {
  const file = jsonPath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
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

export async function createEntry(data: Pick<Entry, 'action'>): Promise<Entry> {
  return runExclusive(async () => {
    const entries = await readEntries();
    const now = new Date().toISOString();
    const entry: Entry = {
      id: randomUUID(),
      action: data.action,
      createdAt: now,
      updatedAt: now,
    };
    entries.push(entry);
    await writeEntries(entries);
    return entry;
  });
}

export async function updateEntry(
  id: string,
  data: Partial<Omit<Entry, 'id' | 'createdAt'>>,
): Promise<Entry | null> {
  return runExclusive(async () => {
    const entries = await readEntries();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) return null;

    const existing = entries[idx]!;
    const next: Entry = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    entries[idx] = next;
    await writeEntries(entries);
    return next;
  });
}

export async function listEntries(): Promise<Entry[]> {
  return runExclusive(async () => {
    const entries = await readEntries();
    return [...entries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  });
}
