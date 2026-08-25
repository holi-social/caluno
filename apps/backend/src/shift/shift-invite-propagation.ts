import { and, eq, inArray } from 'drizzle-orm';
import type { Database } from '../database/database.module';
import * as schema from '../database/schema';
import type { ShiftInviteStatus } from './enums';

export async function propagateShiftInviteStatusToFutureInstances(
  tx: Pick<Database, 'update' | 'query'>,
  shiftId: string,
  userId: string,
  status: ShiftInviteStatus,
): Promise<void> {
  const now = new Date();

  const futureInstances = await tx.query.shiftInstances.findMany({
    where: {
      masterId: shiftId,
      isCancelled: false,
      actualStartsAt: { gte: now },
    },
    columns: { id: true },
  });

  if (futureInstances.length === 0) {
    return;
  }

  await tx
    .update(schema.shiftInstanceInvites)
    .set({ status })
    .where(
      and(
        eq(schema.shiftInstanceInvites.userId, userId),
        inArray(
          schema.shiftInstanceInvites.instanceId,
          futureInstances.map((instance) => instance.id),
        ),
      ),
    );
}
