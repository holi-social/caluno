import type { Database } from '../../src/database/database.module';
import * as schema from '../../src/database/schema';
import { ShiftInviteStatus } from '../../src/shift/enums';

export type ShiftInstanceInvite =
  typeof schema.shiftInstanceInvites.$inferSelect;

export const createShiftInstanceInvite = async (
  db: Database,
  args: {
    instanceId: string;
    userId: string;
    status?: ShiftInviteStatus;
  },
): Promise<ShiftInstanceInvite> => {
  const [invite] = await db
    .insert(schema.shiftInstanceInvites)
    .values({
      instanceId: args.instanceId,
      userId: args.userId,
      status: args.status ?? ShiftInviteStatus.INVITED,
    })
    .returning();

  if (!invite) throw new Error('Failed to create test shift instance invite');
  return invite;
};
