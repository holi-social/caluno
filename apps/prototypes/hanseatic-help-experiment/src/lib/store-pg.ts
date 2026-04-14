import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { hanseaticHelpEntries, type HanseaticHelpEntryRow } from '@/db/schema';
import type { Action, Entry } from './types';

function rowToEntry(row: HanseaticHelpEntryRow): Entry {
  return {
    id: row.id,
    action: row.action as Action,
    plannedDurationHours: row.plannedDurationHours ?? undefined,
    arrivalTime: row.arrivalTime ?? undefined,
    breakArrivalTime: row.breakArrivalTime ?? undefined,
    breakDepartureTime: row.breakDepartureTime ?? undefined,
    name: row.name ?? undefined,
    email: row.email ?? undefined,
    gdprConsent: row.gdprConsent ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createEntry(data: Pick<Entry, 'action'>): Promise<Entry> {
  const [row] = await db
    .insert(hanseaticHelpEntries)
    .values({ action: data.action })
    .returning();
  if (!row) {
    throw new Error('Failed to create entry');
  }
  return rowToEntry(row);
}

export async function updateEntry(
  id: string,
  data: Partial<Omit<Entry, 'id' | 'createdAt'>>,
): Promise<Entry | null> {
  const [existing] = await db
    .select()
    .from(hanseaticHelpEntries)
    .where(eq(hanseaticHelpEntries.id, id))
    .limit(1);
  if (!existing) return null;

  const patch: Partial<typeof hanseaticHelpEntries.$inferInsert> = {};
  if (data.action !== undefined) patch.action = data.action;
  if (data.plannedDurationHours !== undefined) {
    patch.plannedDurationHours = data.plannedDurationHours;
  }
  if (data.arrivalTime !== undefined) patch.arrivalTime = data.arrivalTime;
  if (data.breakArrivalTime !== undefined) {
    patch.breakArrivalTime = data.breakArrivalTime;
  }
  if (data.breakDepartureTime !== undefined) {
    patch.breakDepartureTime = data.breakDepartureTime;
  }
  if (data.name !== undefined) patch.name = data.name;
  if (data.email !== undefined) patch.email = data.email;
  if (data.gdprConsent !== undefined) patch.gdprConsent = data.gdprConsent;

  if (Object.keys(patch).length === 0) {
    return rowToEntry(existing);
  }

  const [row] = await db
    .update(hanseaticHelpEntries)
    .set(patch)
    .where(eq(hanseaticHelpEntries.id, id))
    .returning();
  return row ? rowToEntry(row) : null;
}

export async function listEntries(): Promise<Entry[]> {
  const rows = await db
    .select()
    .from(hanseaticHelpEntries)
    .orderBy(desc(hanseaticHelpEntries.createdAt));
  return rows.map(rowToEntry);
}
