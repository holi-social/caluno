import type { Database } from '../../src/database/database.module';
import * as schema from '../../src/database/schema';
import { MembershipRequestStatus } from '../../src/membership/enums';

export type MembershipRequest = typeof schema.membershipRequests.$inferSelect;

type MembershipRequestMetadata = {
  intendedEventIds?: string[];
  intendedShiftInstanceIds?: string[];
  intendedShiftIds?: string[];
};

export const createMembershipRequest = async (
  db: Database,
  overrides: {
    userId: string;
    organizationUnitId: string;
    status?: MembershipRequestStatus;
    metadata?: MembershipRequestMetadata;
  },
): Promise<MembershipRequest> => {
  const [request] = await db
    .insert(schema.membershipRequests)
    .values({
      userId: overrides.userId,
      organizationUnitId: overrides.organizationUnitId,
      status: overrides.status ?? MembershipRequestStatus.PENDING,
      metadata: overrides.metadata ?? {},
    })
    .returning();

  if (!request) {
    throw new Error('Failed to create test membership request');
  }

  return request;
};
