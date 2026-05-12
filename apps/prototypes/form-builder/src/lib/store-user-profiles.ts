import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { SystemRequirementKey } from './system-requirements';

/**
 * User-profile store for System Requirement fields.
 *
 * Each volunteer has one profile keyed by user id. Each profile holds
 * answers to platform-defined system requirements (e.g. Geburtsdatum),
 * tagged with the sub-org where the data was last filled so we can
 * decide on the public form whether to hide the field, pre-fill it,
 * or render it empty.
 *
 * Prototype shortcut: the "volunteer" is identified by the same
 * USER_COOKIE the builder uses (Andrea/Karl). In production this slot
 * is replaced by a real auth identity; only `getVolunteerIdFromCookie`
 * needs to change.
 */

export type ProfileEntryValue = string | boolean | string[];

export type ProfileEntry = {
  value: ProfileEntryValue;
  subOrg: string;
  updatedAt: string;
};

export type UserProfile = {
  userId: string;
  entries: Partial<Record<SystemRequirementKey, ProfileEntry>>;
};

type ProfileStore = Record<string, UserProfile>;

function jsonPath(): string {
  return path.join(process.cwd(), 'data', 'user-profiles.json');
}

async function readStore(): Promise<ProfileStore> {
  const file = jsonPath();
  try {
    const raw = await readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as ProfileStore;
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      await seedProfiles();
      const raw = await readFile(file, 'utf8');
      return JSON.parse(raw) as ProfileStore;
    }
    throw e;
  }
}

async function writeStore(store: ProfileStore): Promise<void> {
  const file = jsonPath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

async function seedProfiles(): Promise<void> {
  const now = new Date().toISOString();
  const seed: ProfileStore = {
    karl: {
      userId: 'karl',
      entries: {
        geburtsdatum: {
          value: '1980-05-12',
          subOrg: 'Karlstrasse 13',
          updatedAt: now,
        },
      },
    },
  };
  await writeStore(seed);
}

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

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  return runExclusive(async () => {
    const store = await readStore();
    return store[userId] ?? null;
  });
}

export async function upsertProfileEntries(
  userId: string,
  updates: { key: SystemRequirementKey; value: ProfileEntryValue; subOrg: string }[],
): Promise<UserProfile> {
  return runExclusive(async () => {
    const store = await readStore();
    const now = new Date().toISOString();
    const existing = store[userId] ?? { userId, entries: {} };
    const entries = { ...existing.entries };
    for (const u of updates) {
      entries[u.key] = { value: u.value, subOrg: u.subOrg, updatedAt: now };
    }
    const next: UserProfile = { userId, entries };
    store[userId] = next;
    await writeStore(store);
    return next;
  });
}
