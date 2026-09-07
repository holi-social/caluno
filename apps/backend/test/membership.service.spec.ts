import { beforeAll, describe, expect, it, mock } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import { EventInviteStatus } from '../src/event/enums';
import { NotFoundGraphQLError } from '../src/graphql/errors';
import { MembershipRequestStatus } from '../src/membership/enums';
import { MembershipService } from '../src/membership/membership.service';
import { NotificationService } from '../src/notification';
import { RequiredFormService } from '../src/requirement-profile/services/required-form.service';
import { RequirementProfileService } from '../src/requirement-profile/services/requirement-profile.service';
import { PostHogService } from '../src/shared/observability/posthog.service';
import { ShiftInviteStatus } from '../src/shift/enums';
import {
  createEvent,
  createShift,
  createShiftInstance,
  createUser,
} from './factories';
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
      { shareSubmissionsWithOrgUnit: async () => {} } as never,
      { capture: () => {} } as unknown as PostHogService,
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

  describe('invite purge on membership end', () => {
    const seedInvites = async () => {
      const user = await createUser(db);
      const otherUser = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Invite Purge Org ${crypto.randomUUID()}`,
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
      const membership = await addMembership(db, user.id, root.id);
      const childMembership = await addMembership(db, user.id, child.id);

      const event = await createEvent(db, { organizationUnitId: root.id });
      const childEvent = await createEvent(db, {
        organizationUnitId: child.id,
      });
      const shift = await createShift(db, { organizationUnitId: root.id });
      const childShift = await createShift(db, {
        organizationUnitId: child.id,
      });
      const instance = await db.query.shiftInstances.findFirst({
        where: { masterId: shift.id },
      });
      const childInstance = await db.query.shiftInstances.findFirst({
        where: { masterId: childShift.id },
      });
      if (!instance || !childInstance) {
        throw new Error('Expected expanded shift instance');
      }

      const { organization: otherOrg, type: otherType } =
        await createOrganizationWithType(
          db,
          `Other Invite Org ${crypto.randomUUID()}`,
        );
      const otherUnit = await createUnit(db, {
        organizationId: otherOrg.id,
        typeId: otherType.id,
        name: 'other-root',
      });
      const otherEvent = await createEvent(db, {
        organizationUnitId: otherUnit.id,
      });

      await db.insert(schema.eventInvites).values([
        {
          eventId: event.id,
          userId: user.id,
          status: EventInviteStatus.JOINED,
        },
        {
          eventId: childEvent.id,
          userId: user.id,
          status: EventInviteStatus.ADMIN_INVITED,
        },
        {
          eventId: event.id,
          userId: otherUser.id,
          status: EventInviteStatus.ADMIN_INVITED,
        },
        {
          eventId: otherEvent.id,
          userId: user.id,
          status: EventInviteStatus.ADMIN_INVITED,
        },
      ]);
      await db.insert(schema.shiftInvites).values([
        {
          shiftId: shift.id,
          userId: user.id,
          status: ShiftInviteStatus.ADMIN_REJECTED,
        },
        {
          shiftId: childShift.id,
          userId: user.id,
          status: ShiftInviteStatus.ADMIN_INVITED,
        },
      ]);
      await db.insert(schema.shiftInstanceInvites).values([
        {
          instanceId: instance.id,
          userId: user.id,
          status: ShiftInviteStatus.JOINED,
        },
        {
          instanceId: childInstance.id,
          userId: user.id,
          status: ShiftInviteStatus.JOINED,
        },
      ]);
      await db.insert(schema.membershipRequests).values([
        {
          userId: user.id,
          organizationUnitId: root.id,
          status: MembershipRequestStatus.ACCEPTED,
        },
        {
          userId: user.id,
          organizationUnitId: child.id,
          status: MembershipRequestStatus.ACCEPTED,
        },
      ]);

      return {
        user,
        otherUser,
        root,
        child,
        membership,
        childMembership,
        event,
        childEvent,
        shift,
        childShift,
        instance,
        childInstance,
        otherEvent,
      };
    };

    const remainingInviteIds = async (userId: string) => {
      const [eventRows, shiftRows, instanceRows] = await Promise.all([
        db.query.eventInvites.findMany({ where: { userId } }),
        db.query.shiftInvites.findMany({ where: { userId } }),
        db.query.shiftInstanceInvites.findMany({ where: { userId } }),
      ]);
      return {
        eventIds: eventRows.map((row) => row.eventId).sort(),
        shiftIds: shiftRows.map((row) => row.shiftId).sort(),
        instanceIds: instanceRows.map((row) => row.instanceId).sort(),
      };
    };

    it('leaveMembership hard-deletes this user invites on that org unit only', async () => {
      const seeded = await seedInvites();

      await service.leaveMembership(seeded.membership.id, seeded.user.id);

      const remaining = await remainingInviteIds(seeded.user.id);
      expect(remaining.eventIds).toEqual(
        [seeded.childEvent.id, seeded.otherEvent.id].sort(),
      );
      expect(remaining.shiftIds).toEqual([seeded.childShift.id]);
      expect(remaining.instanceIds).toEqual([seeded.childInstance.id]);

      const otherUserEvent = await db.query.eventInvites.findFirst({
        where: {
          eventId: seeded.event.id,
          userId: seeded.otherUser.id,
        },
      });
      expect(otherUserEvent).toBeTruthy();

      const remainingRequests = await db.query.membershipRequests.findMany({
        where: { userId: seeded.user.id },
      });
      expect(
        remainingRequests.map((row) => row.organizationUnitId).sort(),
      ).toEqual([seeded.child.id]);
    });

    it('removeMembership hard-deletes this user invites on that org unit the same way', async () => {
      const seeded = await seedInvites();

      await service.removeMembership(seeded.membership.id, seeded.root.id);

      const remaining = await remainingInviteIds(seeded.user.id);
      expect(remaining.eventIds).toEqual(
        [seeded.childEvent.id, seeded.otherEvent.id].sort(),
      );
      expect(remaining.shiftIds).toEqual([seeded.childShift.id]);
      expect(remaining.instanceIds).toEqual([seeded.childInstance.id]);

      const remainingRequests = await db.query.membershipRequests.findMany({
        where: { userId: seeded.user.id },
      });
      expect(
        remainingRequests.map((row) => row.organizationUnitId).sort(),
      ).toEqual([seeded.child.id]);
    });

    it('removeMembership on a child unit leaves parent-unit invites untouched', async () => {
      const seeded = await seedInvites();

      await service.removeMembership(
        seeded.childMembership.id,
        seeded.child.id,
      );

      const remaining = await remainingInviteIds(seeded.user.id);
      expect(remaining.eventIds).toEqual(
        [seeded.event.id, seeded.otherEvent.id].sort(),
      );
      expect(remaining.shiftIds).toEqual([seeded.shift.id]);
      expect(remaining.instanceIds).toEqual([seeded.instance.id]);

      const remainingRequests = await db.query.membershipRequests.findMany({
        where: { userId: seeded.user.id },
      });
      expect(
        remainingRequests.map((row) => row.organizationUnitId).sort(),
      ).toEqual([seeded.root.id]);
    });

    it('keeps past event and instance invites; deletes all shift invites on that org unit', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Past Invite Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      const membership = await addMembership(db, user.id, unit.id);

      const now = Date.now();
      const pastEvent = await createEvent(db, {
        organizationUnitId: unit.id,
        startsAt: new Date(now - 200_000),
        endsAt: new Date(now - 100_000),
      });
      const currentEvent = await createEvent(db, {
        organizationUnitId: unit.id,
        startsAt: new Date(now - 100_000),
        endsAt: new Date(now + 100_000),
      });
      const futureEvent = await createEvent(db, {
        organizationUnitId: unit.id,
        startsAt: new Date(now + 100_000),
        endsAt: new Date(now + 200_000),
      });

      const pastShift = await createShift(db, {
        organizationUnitId: unit.id,
        startsAt: new Date(now - 200_000),
        endsAt: new Date(now - 100_000),
      });
      const currentShift = await createShift(db, {
        organizationUnitId: unit.id,
        startsAt: new Date(now - 100_000),
        endsAt: new Date(now + 100_000),
      });
      const mixedShift = await createShift(db, {
        organizationUnitId: unit.id,
        startsAt: new Date(now - 200_000),
        endsAt: new Date(now - 100_000),
      });
      const pastMixedInstance = await db.query.shiftInstances.findFirst({
        where: { masterId: mixedShift.id },
      });
      if (!pastMixedInstance) {
        throw new Error('Expected expanded mixed shift instance');
      }
      const futureMixedInstance = await createShiftInstance(db, mixedShift.id, {
        actualStartsAt: new Date(now + 100_000),
        actualEndsAt: new Date(now + 200_000),
        occurrenceIndex: 1,
      });
      const pastInstance = await db.query.shiftInstances.findFirst({
        where: { masterId: pastShift.id },
      });
      const currentInstance = await db.query.shiftInstances.findFirst({
        where: { masterId: currentShift.id },
      });
      if (!pastInstance || !currentInstance) {
        throw new Error('Expected expanded shift instances');
      }

      await db.insert(schema.eventInvites).values([
        {
          eventId: pastEvent.id,
          userId: user.id,
          status: EventInviteStatus.JOINED,
        },
        {
          eventId: currentEvent.id,
          userId: user.id,
          status: EventInviteStatus.JOINED,
        },
        {
          eventId: futureEvent.id,
          userId: user.id,
          status: EventInviteStatus.ADMIN_INVITED,
        },
      ]);
      await db.insert(schema.shiftInvites).values([
        {
          shiftId: pastShift.id,
          userId: user.id,
          status: ShiftInviteStatus.JOINED,
        },
        {
          shiftId: currentShift.id,
          userId: user.id,
          status: ShiftInviteStatus.ADMIN_INVITED,
        },
        {
          shiftId: mixedShift.id,
          userId: user.id,
          status: ShiftInviteStatus.JOINED,
        },
      ]);
      await db.insert(schema.shiftInstanceInvites).values([
        {
          instanceId: pastInstance.id,
          userId: user.id,
          status: ShiftInviteStatus.JOINED,
        },
        {
          instanceId: currentInstance.id,
          userId: user.id,
          status: ShiftInviteStatus.JOINED,
        },
        {
          instanceId: pastMixedInstance.id,
          userId: user.id,
          status: ShiftInviteStatus.JOINED,
        },
        {
          instanceId: futureMixedInstance.id,
          userId: user.id,
          status: ShiftInviteStatus.ADMIN_INVITED,
        },
      ]);

      await service.leaveMembership(membership.id, user.id);

      const remaining = await remainingInviteIds(user.id);
      expect(remaining.eventIds).toEqual([pastEvent.id]);
      expect(remaining.shiftIds).toEqual([]);
      expect(remaining.instanceIds).toEqual(
        [pastInstance.id, pastMixedInstance.id].sort(),
      );
    });

    it('deletes the membership request so the user can re-apply', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Reapply Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      const membership = await addMembership(db, user.id, unit.id);
      await db.insert(schema.membershipRequests).values({
        userId: user.id,
        organizationUnitId: unit.id,
        status: MembershipRequestStatus.ACCEPTED,
      });

      await service.leaveMembership(membership.id, user.id);

      const leftover = await db.query.membershipRequests.findFirst({
        where: { userId: user.id, organizationUnitId: unit.id },
      });
      expect(leftover).toBeUndefined();

      const reapplied = await service.createMembershipRequest(user.id, unit.id);
      expect(reapplied.status).toBe(MembershipRequestStatus.PENDING);
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
