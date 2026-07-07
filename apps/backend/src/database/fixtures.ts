import { hashPassword } from 'better-auth/crypto';
import { inArray } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  DEFAULT_MEMBER_ROLE_NAME,
  DEFAULT_OWNER_ROLE_NAME,
  MEMBER_DEFAULT_PERMISSIONS,
  PERMISSIONS,
} from '../auth/constants';
import { permissions } from '../auth/schemas/permission.schema';
import { MembershipRequestStatus } from '../membership/enums';
import { ShiftInviteStatus, ShiftVisibility } from '../shift/enums';
import { expandShift } from '../shift/utils/rrule-expander';
import { slugify } from '../utils/slug.util';
import { relations } from './relations';
import * as schema from './schema';

process.env.TZ = 'Europe/Berlin';

const FIXTURE_PASSWORD = 'abcd1234';
const ORG_NAME = 'Playground';
const FIXTURE_TIMEZONE = 'Europe/Berlin';
const SHIFT_DURATION_MINUTES = 240;
const RECURRENCE_WEEKS_BACK = 12;

const WEEKLY_RRULE = {
  MONDAY: 'FREQ=WEEKLY;BYDAY=MO;WKST=MO',
  WEDNESDAY: 'FREQ=WEEKLY;BYDAY=WE;WKST=MO',
  FRIDAY: 'FREQ=WEEKLY;BYDAY=FR;WKST=MO',
} as const;

const SUPERVISOR_ROLE_NAME = 'Supervisor';
const SUPERVISOR_PERMISSIONS = [
  PERMISSIONS.ORG_VIEW,
  PERMISSIONS.SHIFT_VIEW,
  PERMISSIONS.SHIFT_EDIT,
  PERMISSIONS.VOLUNTEER_VIEW,
] as const;

type Database = NodePgDatabase<typeof relations>;

type FixtureUser = {
  id: string;
  email: string;
  name: string;
};

const memberEmail = (index: number): string =>
  `member${String(index).padStart(2, '0')}@clippy.social`;

type FixtureDateParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
};

const getDateInFixtureTimezone = (instant: Date): FixtureDateParts => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: FIXTURE_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).formatToParts(instant);

  const read = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(read('year')),
    month: Number(read('month')),
    day: Number(read('day')),
    weekday: weekdayMap[read('weekday')] ?? 0,
  };
};

const addDaysInFixtureTimezone = (
  year: number,
  month: number,
  day: number,
  days: number,
): Omit<FixtureDateParts, 'weekday'> => {
  const noonUtc = fixtureWallClockToUtc(year, month, day, 12);
  return getDateInFixtureTimezone(
    new Date(noonUtc.getTime() + days * 86_400_000),
  );
};

const findWeekdayWeeksAgo = (
  weekday: number,
  weeksAgo: number,
): Omit<FixtureDateParts, 'weekday'> => {
  for (let daysBack = 0; daysBack < 7; daysBack += 1) {
    const parts = getDateInFixtureTimezone(
      new Date(Date.now() - daysBack * 86_400_000),
    );

    if (parts.weekday === weekday) {
      return addDaysInFixtureTimezone(
        parts.year,
        parts.month,
        parts.day,
        -weeksAgo * 7,
      );
    }
  }

  throw new Error(
    `Could not find weekday ${weekday} in ${FIXTURE_TIMEZONE} calendar`,
  );
};

const fixtureWallClockToUtc = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): Date => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: FIXTURE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const baseUtc = Date.UTC(year, month - 1, day, hour, minute);

  for (let offsetHours = -3; offsetHours <= 3; offsetHours += 0.25) {
    const candidate = new Date(baseUtc - offsetHours * 3_600_000);
    const formatted = formatter.formatToParts(candidate);
    const read = (type: string): number =>
      Number(formatted.find((part) => part.type === type)?.value);

    if (
      read('year') === year &&
      read('month') === month &&
      read('day') === day &&
      read('hour') === hour &&
      read('minute') === minute
    ) {
      return candidate;
    }
  }

  throw new Error(
    `Could not resolve ${year}-${month}-${day} ${hour}:${minute} in ${FIXTURE_TIMEZONE}`,
  );
};

const addHours = (date: Date, hours: number): Date =>
  new Date(date.getTime() + hours * 3_600_000);

const createAuthUser = async (
  db: Database,
  hashedPassword: string,
  input: { email: string; name: string },
): Promise<FixtureUser> => {
  const id = crypto.randomUUID();

  await db.insert(schema.users).values({
    id,
    name: input.name,
    email: input.email,
    emailVerified: true,
    locale: 'en',
  });

  await db.insert(schema.accounts).values({
    id: crypto.randomUUID(),
    accountId: input.email,
    providerId: 'credential',
    userId: id,
    password: hashedPassword,
  });

  return { id, email: input.email, name: input.name };
};

const createMembershipWithRole = async (
  db: Database,
  userId: string,
  organizationUnitId: string,
  roleId: string,
): Promise<void> => {
  const [membership] = await db
    .insert(schema.memberships)
    .values({ userId, organizationUnitId })
    .returning();

  if (!membership) {
    throw new Error('Failed to create membership');
  }

  await db.insert(schema.membershipRoles).values({
    membershipId: membership.id,
    roleId,
  });
};

const createPlaygroundOrganization = async (
  db: Database,
  adminUserId: string,
): Promise<{
  organizationId: string;
  rootUnitId: string;
  ownerRoleId: string;
  memberRoleId: string;
  supervisorRoleId: string;
}> => {
  const allPermissionKeys = Object.values(PERMISSIONS).filter(
    (permission) => !permission.startsWith('org-role:'),
  );

  return db.transaction(async (tx) => {
    const [organization] = await tx
      .insert(schema.organizations)
      .values({
        name: ORG_NAME,
        slug: slugify(ORG_NAME),
        contactEmail: 'admin@clippy.social',
        description: 'Local development playground organization',
      })
      .returning();

    if (!organization) {
      throw new Error('Failed to create Playground organization');
    }

    const [rootType] = await tx
      .insert(schema.organizationUnitTypes)
      .values({
        name: 'management',
        description: `organization managment unit for ${organization.name}`,
        icon: 'building-2',
      })
      .returning();

    if (!rootType) {
      throw new Error('Failed to create organization unit type');
    }

    const [rootUnit] = await tx
      .insert(schema.organizationUnits)
      .values({
        organizationId: organization.id,
        parentId: null,
        typeId: rootType.id,
        name: organization.name,
        slug: organization.slug,
        contactEmail: organization.contactEmail,
        description: organization.description,
      })
      .returning();

    if (!rootUnit) {
      throw new Error('Failed to create root organization unit');
    }

    const [ownerRole] = await tx
      .insert(schema.roles)
      .values({
        name: DEFAULT_OWNER_ROLE_NAME,
        description: `Owner role for organization ${organization.name}`,
        isInternal: true,
        organizationId: organization.id,
      })
      .returning();

    const [memberRole] = await tx
      .insert(schema.roles)
      .values({
        name: DEFAULT_MEMBER_ROLE_NAME,
        description: `Member role for organization ${organization.name}`,
        isInternal: true,
        organizationId: organization.id,
      })
      .returning();

    const [supervisorRole] = await tx
      .insert(schema.roles)
      .values({
        name: SUPERVISOR_ROLE_NAME,
        description: `Supervisor role for organization ${organization.name}`,
        isInternal: false,
        organizationId: organization.id,
      })
      .returning();

    if (!ownerRole || !memberRole || !supervisorRole) {
      throw new Error('Failed to create organization roles');
    }

    const memberPermissionRows = await tx
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.key, [...MEMBER_DEFAULT_PERMISSIONS]));

    if (memberPermissionRows.length > 0) {
      await tx.insert(schema.rolePermissions).values(
        memberPermissionRows.map((permission) => ({
          roleId: memberRole.id,
          permissionId: permission.id,
        })),
      );
    }

    const ownerPermissionRows = await tx
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.key, allPermissionKeys));

    if (ownerPermissionRows.length > 0) {
      await tx.insert(schema.rolePermissions).values(
        ownerPermissionRows.map((permission) => ({
          roleId: ownerRole.id,
          permissionId: permission.id,
        })),
      );
    }

    const supervisorPermissionRows = await tx
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.key, [...SUPERVISOR_PERMISSIONS]));

    if (supervisorPermissionRows.length > 0) {
      await tx.insert(schema.rolePermissions).values(
        supervisorPermissionRows.map((permission) => ({
          roleId: supervisorRole.id,
          permissionId: permission.id,
        })),
      );
    }

    const [adminMembership] = await tx
      .insert(schema.memberships)
      .values({ userId: adminUserId, organizationUnitId: rootUnit.id })
      .returning();

    if (!adminMembership) {
      throw new Error('Failed to create admin membership');
    }

    await tx.insert(schema.membershipRoles).values({
      membershipId: adminMembership.id,
      roleId: ownerRole.id,
    });

    return {
      organizationId: organization.id,
      rootUnitId: rootUnit.id,
      ownerRoleId: ownerRole.id,
      memberRoleId: memberRole.id,
      supervisorRoleId: supervisorRole.id,
    };
  });
};

type ShiftFixture = {
  title: string;
  startsAt: Date;
  rrule: string;
  inviteUserIds: string[];
};

const pickRecentPastInstance = (
  instances: Array<typeof schema.shiftInstances.$inferSelect>,
): typeof schema.shiftInstances.$inferSelect => {
  const now = Date.now();
  const pastInstances = instances
    .filter((instance) => instance.actualStartsAt.getTime() < now)
    .sort(
      (left, right) =>
        right.actualStartsAt.getTime() - left.actualStartsAt.getTime(),
    );

  const instance = pastInstances[0] ?? instances[0];
  if (!instance) {
    throw new Error('Failed to resolve shift instance');
  }

  return instance;
};

const createShiftWithInvites = async (
  db: Database,
  organizationUnitId: string,
  createdById: string,
  shift: ShiftFixture,
): Promise<{ shiftId: string; instanceId: string; instanceStartsAt: Date }> => {
  const [createdShift] = await db
    .insert(schema.shifts)
    .values({
      title: shift.title,
      slug: slugify(shift.title),
      organizationUnitId,
      createdById,
      visibility: ShiftVisibility.INVITED_MEMBERS,
      originalStartsAt: shift.startsAt,
      durationMinutes: SHIFT_DURATION_MINUTES,
      rrule: shift.rrule,
    })
    .returning();

  if (!createdShift) {
    throw new Error(`Failed to create shift: ${shift.title}`);
  }

  const instances = expandShift(
    shift.rrule,
    shift.startsAt,
    SHIFT_DURATION_MINUTES,
  );
  const insertedInstances = await db
    .insert(schema.shiftInstances)
    .values(
      instances.map((instance) => ({
        masterId: createdShift.id,
        actualStartsAt: instance.actualStartsAt,
        actualEndsAt: instance.actualEndsAt,
        occurrenceIndex: instance.occurrenceIndex,
      })),
    )
    .returning();

  if (shift.inviteUserIds.length > 0) {
    await db.insert(schema.shiftInstanceInvites).values(
      insertedInstances.flatMap((instance) =>
        shift.inviteUserIds.map((userId) => ({
          instanceId: instance.id,
          userId,
          status: ShiftInviteStatus.ACCEPTED,
        })),
      ),
    );
  }

  const recentInstance = pickRecentPastInstance(insertedInstances);

  return {
    shiftId: createdShift.id,
    instanceId: recentInstance.id,
    instanceStartsAt: recentInstance.actualStartsAt,
  };
};

const createTimeEntries = async (
  db: Database,
  approvedMembers: FixtureUser[],
  shiftInstances: {
    communitySupport: { startsAt: Date; instanceId: string };
    foodDistribution: { startsAt: Date; instanceId: string };
  },
): Promise<void> => {
  const entries: Array<typeof schema.timeEntries.$inferInsert> = [];

  for (const [index, member] of approvedMembers.entries()) {
    const memberNumber = index + 1;

    if (member.email === 'supervisor@clippy.social') {
      entries.push({
        shiftInstanceId: shiftInstances.communitySupport.instanceId,
        volunteerId: member.id,
        startedAt: addHours(shiftInstances.communitySupport.startsAt, 0.5),
        endedAt: addHours(shiftInstances.communitySupport.startsAt, 3.5),
        notes: 'Supervisor coverage',
      });
      entries.push({
        shiftInstanceId: shiftInstances.foodDistribution.instanceId,
        volunteerId: member.id,
        startedAt: addHours(shiftInstances.foodDistribution.startsAt, 0),
        endedAt: addHours(shiftInstances.foodDistribution.startsAt, 3),
        notes: 'Distribution lead',
      });
      continue;
    }

    const closedHours = 2 + (memberNumber % 3);
    entries.push({
      shiftInstanceId: shiftInstances.communitySupport.instanceId,
      volunteerId: member.id,
      startedAt: addHours(
        shiftInstances.communitySupport.startsAt,
        memberNumber % 2,
      ),
      endedAt: addHours(
        shiftInstances.communitySupport.startsAt,
        (memberNumber % 2) + closedHours,
      ),
      notes: `Community support (${closedHours}h)`,
    });

    if (memberNumber % 2 === 0) {
      entries.push({
        shiftInstanceId: shiftInstances.communitySupport.instanceId,
        volunteerId: member.id,
        startedAt: addHours(
          shiftInstances.communitySupport.startsAt,
          closedHours + 0.5,
        ),
        endedAt: addHours(
          shiftInstances.communitySupport.startsAt,
          closedHours + 1.5,
        ),
        notes: 'Additional community support block',
      });
    }

    if (memberNumber <= 6) {
      entries.push({
        shiftInstanceId: shiftInstances.foodDistribution.instanceId,
        volunteerId: member.id,
        startedAt: addHours(
          shiftInstances.foodDistribution.startsAt,
          memberNumber % 3,
        ),
        endedAt: addHours(
          shiftInstances.foodDistribution.startsAt,
          (memberNumber % 3) + 2,
        ),
        notes: 'Food distribution',
      });
    }

    if (memberNumber <= 3) {
      entries.push({
        shiftInstanceId: shiftInstances.communitySupport.instanceId,
        volunteerId: member.id,
        startedAt: addHours(
          shiftInstances.communitySupport.startsAt,
          1 + memberNumber * 0.25,
        ),
        endedAt: null,
        notes: 'Open check-in',
      });
    }
  }

  if (entries.length > 0) {
    await db.insert(schema.timeEntries).values(entries);
  }
};

async function seedFixtures() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false,
  });

  const db = drizzle({ client: pool, relations });
  const hashedPassword = await hashPassword(FIXTURE_PASSWORD);

  const admin = await createAuthUser(db, hashedPassword, {
    email: 'admin@clippy.social',
    name: 'Playground Admin',
  });

  const org = await createPlaygroundOrganization(db, admin.id);

  const supervisor = await createAuthUser(db, hashedPassword, {
    email: 'supervisor@clippy.social',
    name: 'Playground Supervisor',
  });

  const members: FixtureUser[] = [];
  for (let index = 1; index <= 10; index += 1) {
    members.push(
      await createAuthUser(db, hashedPassword, {
        email: memberEmail(index),
        name: `Playground Member ${String(index).padStart(2, '0')}`,
      }),
    );
  }

  await createMembershipWithRole(
    db,
    supervisor.id,
    org.rootUnitId,
    org.supervisorRoleId,
  );

  for (const member of members) {
    await createMembershipWithRole(
      db,
      member.id,
      org.rootUnitId,
      org.memberRoleId,
    );
  }

  const pendingUsers = await Promise.all(
    ['pending01@clippy.social', 'pending02@clippy.social'].map((email, index) =>
      createAuthUser(db, hashedPassword, {
        email,
        name: `Pending Applicant ${String(index + 1).padStart(2, '0')}`,
      }),
    ),
  );

  const rejectedUser = await createAuthUser(db, hashedPassword, {
    email: 'rejected01@clippy.social',
    name: 'Rejected Applicant',
  });

  await db.insert(schema.membershipRequests).values([
    ...pendingUsers.map((user) => ({
      userId: user.id,
      organizationUnitId: org.rootUnitId,
      status: MembershipRequestStatus.PENDING,
    })),
    {
      userId: rejectedUser.id,
      organizationUnitId: org.rootUnitId,
      status: MembershipRequestStatus.REJECTED,
      reviewedById: admin.id,
      reviewedAt: new Date(),
      rejectionReason: 'Fixture rejected applicant',
    },
  ]);

  const approvedUserIds = [
    admin.id,
    supervisor.id,
    ...members.map((member) => member.id),
  ];

  const partialInviteUserIds = [
    supervisor.id,
    ...members.slice(0, 4).map((member) => member.id),
  ];

  const mondayAnchor = findWeekdayWeeksAgo(1, RECURRENCE_WEEKS_BACK);
  const wednesdayAnchor = findWeekdayWeeksAgo(3, RECURRENCE_WEEKS_BACK);
  const fridayAnchor = findWeekdayWeeksAgo(5, RECURRENCE_WEEKS_BACK);

  const communitySupportStart = fixtureWallClockToUtc(
    mondayAnchor.year,
    mondayAnchor.month,
    mondayAnchor.day,
    8,
  );
  const foodDistributionStart = fixtureWallClockToUtc(
    wednesdayAnchor.year,
    wednesdayAnchor.month,
    wednesdayAnchor.day,
    12,
  );
  const eventAssistanceStart = fixtureWallClockToUtc(
    fridayAnchor.year,
    fridayAnchor.month,
    fridayAnchor.day,
    16,
  );

  const communitySupport = await createShiftWithInvites(
    db,
    org.rootUnitId,
    admin.id,
    {
      title: 'Community Support',
      startsAt: communitySupportStart,
      rrule: WEEKLY_RRULE.MONDAY,
      inviteUserIds: approvedUserIds,
    },
  );

  const foodDistribution = await createShiftWithInvites(
    db,
    org.rootUnitId,
    admin.id,
    {
      title: 'Food Distribution',
      startsAt: foodDistributionStart,
      rrule: WEEKLY_RRULE.WEDNESDAY,
      inviteUserIds: partialInviteUserIds,
    },
  );

  await createShiftWithInvites(db, org.rootUnitId, admin.id, {
    title: 'Event Assistance',
    startsAt: eventAssistanceStart,
    rrule: WEEKLY_RRULE.FRIDAY,
    inviteUserIds: [],
  });

  await createTimeEntries(db, [supervisor, ...members], {
    communitySupport: {
      startsAt: communitySupport.instanceStartsAt,
      instanceId: communitySupport.instanceId,
    },
    foodDistribution: {
      startsAt: foodDistribution.instanceStartsAt,
      instanceId: foodDistribution.instanceId,
    },
  });

  console.log(`Created Playground organization (${org.organizationId})`);
  console.log(`Root unit: ${org.rootUnitId}`);
  console.log('Users: 15 accounts with password abcd1234');
  console.log('Memberships: 12 approved, 2 pending, 1 rejected');
  console.log(
    'Shifts: Community Support (Mon), Food Distribution (Wed), Event Assistance (Fri)',
  );
  console.log(
    'Time entries: created across Community Support and Food Distribution',
  );

  await pool.end();
}

seedFixtures().catch((error) => {
  console.error(error);
  process.exit(1);
});
