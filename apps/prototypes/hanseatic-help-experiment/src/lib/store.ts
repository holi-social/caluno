import { getPersistenceMode } from './persistence-mode';
import type { Entry } from './types';
import * as jsonStore from './store-json';

type PgStore = typeof import('./store-pg');

let pgStore: PgStore | undefined;

async function pg(): Promise<PgStore> {
  pgStore ??= await import('./store-pg');
  return pgStore;
}

export async function createEntry(data: Pick<Entry, 'action'>): Promise<Entry> {
  if (getPersistenceMode() === 'json') return jsonStore.createEntry(data);
  return (await pg()).createEntry(data);
}

export async function updateEntry(
  id: string,
  data: Partial<Omit<Entry, 'id' | 'createdAt'>>,
): Promise<Entry | null> {
  if (getPersistenceMode() === 'json') return jsonStore.updateEntry(id, data);
  return (await pg()).updateEntry(id, data);
}

export async function listEntries(): Promise<Entry[]> {
  if (getPersistenceMode() === 'json') return jsonStore.listEntries();
  return (await pg()).listEntries();
}
