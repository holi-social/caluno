import { beforeAll, describe, expect, it, mock } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import { NotFoundGraphQLError } from '../src/graphql/errors';
import { MembershipRequestStatus } from '../src/membership/enums';
import { MembershipService } from '../src/membership/membership.service';
import { NotificationService } from '../src/notification';
import { RequiredFormService } from '../src/requirement-profile/services/required-form.service';
import { RequirementProfileService } from '../src/requirement-profile/services/requirement-profile.service';
import { PostHogService } from '../src/shared/observability/posthog.service';
import { createUser } from './factories';
import {
  addMembership,
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

describe('MembershipService', () => {
  let moduleRef: TestingModule;
  let db: Database;
  let service: MembershipService;

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);
    service = new MembershipService(
      db,
      {} as RequirementProfileService,
      {
        findUsersWithPermission: mock(async () => []),
      } as unknown as AuthService,
      {
        notifyMembershipLeft: mock(() => undefined),
        notifyMembershipRemoved: mock(() => undefined),
      } as unknown as NotificationService,
      {} as RequiredFormService,
      { captureUserJoinedOrg: () => {} } as unknown as PostHogService,
    );
    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  describe('leaveMembership', () => {
    it('deletes the current user membership', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Leave Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      const membership = await addMembership(db, user.id, unit.id);
      expect(membership).toBeTruthy();

      await service.leaveMembership(membership.id, user.id);

      const after = await db
        .select({ id: schema.memberships.id })
        .from(schema.memberships)
        .where(eq(schema.memberships.id, membership.id));
      expect(after).toEqual([]);
    });

    it('is self-scoped: another user cannot delete it and throws NotFound', async () => {
      const owner = await createUser(db);
      const other = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Scope Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      const membership = await addMembership(db, owner.id, unit.id);

      await expect(
        service.leaveMembership(membership.id, other.id),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);

      const stillThere = await db
        .select({ id: schema.memberships.id })
        .from(schema.memberships)
        .where(eq(schema.memberships.id, membership.id));
      expect(stillThere.length).toBe(1);
    });
  });

  describe('removeMembership', () => {
    it('deletes a membership in the given organization unit', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Admin Remove Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      const membership = await addMembership(db, user.id, unit.id);

      await service.removeMembership(membership.id, unit.id);

      const after = await db
        .select({ id: schema.memberships.id })
        .from(schema.memberships)
        .where(eq(schema.memberships.id, membership.id));
      expect(after).toEqual([]);
    });

    it('leaves other org-unit memberships of the same user untouched', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Keep Other Org ${crypto.randomUUID()}`,
      );
      const root = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'root',
      });
      const child = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'child',
        parentId: root.id,
      });
      const rootMembership = await addMembership(db, user.id, root.id);
      const childMembership = await addMembership(db, user.id, child.id);

      await service.removeMembership(childMembership.id, child.id);

      const remaining = await db
        .select({ id: schema.memberships.id })
        .from(schema.memberships)
        .where(eq(schema.memberships.userId, user.id));
      expect(remaining.map((row) => row.id)).toEqual([rootMembership.id]);
    });

    it('is org-unit-scoped: a membership in another unit throws NotFound', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Scope Remove Org ${crypto.randomUUID()}`,
      );
      const root = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'root',
      });
      const child = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'child',
        parentId: root.id,
      });
      const membership = await addMembership(db, user.id, child.id);

      await expect(
        service.removeMembership(membership.id, root.id),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);

      const stillThere = await db
        .select({ id: schema.memberships.id })
        .from(schema.memberships)
        .where(eq(schema.memberships.id, membership.id));
      expect(stillThere.length).toBe(1);
    });
  });

  describe('removeMembershipRequest', () => {
    it('deletes the current user request', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Dismiss Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      const [request] = await db
        .insert(schema.membershipRequests)
        .values([
          {
            userId: user.id,
            organizationUnitId: unit.id,
            status: MembershipRequestStatus.REJECTED,
            metadata: {},
          },
        ])
        .returning();
      expect(request).toBeTruthy();

      await service.removeMembershipRequest(request.id, user.id);

      const after = await db
        .select({ id: schema.membershipRequests.id })
        .from(schema.membershipRequests)
        .where(eq(schema.membershipRequests.id, request.id));
      expect(after).toEqual([]);
    });

    it('is self-scoped: another user cannot delete it and throws NotFound', async () => {
      const owner = await createUser(db);
      const other = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Dismiss Scope Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      const [request] = await db
        .insert(schema.membershipRequests)
        .values([
          {
            userId: owner.id,
            organizationUnitId: unit.id,
            status: MembershipRequestStatus.REJECTED,
            metadata: {},
          },
        ])
        .returning();

      await expect(
        service.removeMembershipRequest(request.id, other.id),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);

      const stillThere = await db
        .select({ id: schema.membershipRequests.id })
        .from(schema.membershipRequests)
        .where(eq(schema.membershipRequests.id, request.id));
      expect(stillThere.length).toBe(1);
    });
  });

  describe('getMyMembershipRequests', () => {
    it("returns all of the user's requests across every status", async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Filter Org ${crypto.randomUUID()}`,
      );
      // The schema allows only one root unit (parentId IS NULL) per org
      // (uq_organization_units_organization_id_is_root_true). Create the first
      // unit as the root and nest the rest under it, so each is still distinct
      // for the (userId, organizationUnitId) membership-request constraint.
      const root = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'root',
      });
      const mkUnit = (name: string) =>
        createUnit(db, {
          organizationId: organization.id,
          typeId: type.id,
          name,
          parentId: root.id,
        });

      const [pending, accepted, rejected, cancelled] = await Promise.all([
        mkUnit('pending'),
        mkUnit('accepted'),
        mkUnit('rejected'),
        mkUnit('cancelled'),
      ]);

      await db.insert(schema.membershipRequests).values([
        {
          userId: user.id,
          organizationUnitId: pending.id,
          status: MembershipRequestStatus.PENDING,
          metadata: {},
        },
        {
          userId: user.id,
          organizationUnitId: accepted.id,
          status: MembershipRequestStatus.ACCEPTED,
          metadata: {},
        },
        {
          userId: user.id,
          organizationUnitId: rejected.id,
          status: MembershipRequestStatus.REJECTED,
          metadata: {},
        },
        {
          userId: user.id,
          organizationUnitId: cancelled.id,
          status: MembershipRequestStatus.CANCELLED,
          metadata: {},
        },
      ]);

      const items = await service.getMyMembershipRequests(user.id);
      const statuses = items.map((i) => i.status).sort();
      expect(statuses).toEqual([
        MembershipRequestStatus.ACCEPTED,
        MembershipRequestStatus.CANCELLED,
        MembershipRequestStatus.PENDING,
        MembershipRequestStatus.REJECTED,
      ]);
    });
  });
});
