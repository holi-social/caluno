import { eq } from 'drizzle-orm';
import type { Database } from '../../src/database/database.module';
import * as schema from '../../src/database/schema';

export type ShiftInstance = typeof schema.shiftInstances.$inferSelect;

export const createShiftInstance = async (
  db: Database,
  shiftId: string,
  overrides?: Partial<typeof schema.shiftInstances.$inferInsert>,
): Promise<ShiftInstance> => {
  const actualStartsAt =
    overrides?.actualStartsAt ?? new Date('2026-06-19T08:00:00.000Z');
  const actualEndsAt =
    overrides?.actualEndsAt ?? new Date('2026-06-19T10:00:00.000Z');

  const [instance] = await db
    .insert(schema.shiftInstances)
    .values({
      masterId: shiftId,
      actualStartsAt,
      actualEndsAt,
      occurrenceIndex: 1,
      ...overrides,
    })
    .returning();

  if (!instance) {
    throw new Error('Failed to create test shift instance');
  }

  return instance;
};

export const cancelShiftInstance = async (
  db: Database,
  instanceId: string,
): Promise<void> => {
  await db
    .update(schema.shiftInstances)
    .set({ isCancelled: true })
    .where(eq(schema.shiftInstances.id, instanceId));
};
