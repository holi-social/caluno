import { hashPassword } from 'better-auth/crypto';
import { inArray } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  DEFAULT_MEMBER_ROLE_NAME,
  DEFAULT_OWNER_ROLE_NAME,
  PERMISSIONS,
} from '../auth/constants';
import { permissions } from '../auth/schemas/permission.schema';
import { ShiftInviteStatus, ShiftVisibility } from '../shift/enums';
import { expandShift } from '../shift/utils/rrule-expander';
import { slugify } from '../utils/slug.util';
import { relations } from './relations';
import * as schema from './schema';

process.env.TZ = 'Europe/Berlin';

const FIXTURE_PASSWORD = 'yqqilc123!';
const FIXTURE_TIMEZONE = 'Europe/Berlin';
const SHIFT_DURATION_MINUTES = 240;
const MEMBER_COUNT = 100;

const STAGING_ORGS = [
  { name: 'Holi', slug: 'holi', adminEmail: 'admin@holi.social' },
  { name: 'Clippy', slug: 'clippy', adminEmail: 'admin@clippy.social' },
] as const;

const ROLE_DEFINITIONS = [
  {
    name: 'Volunteer',
    permissions: [PERMISSIONS.ORG_VIEW, PERMISSIONS.SHIFT_VIEW],
  },
  {
    name: 'Supervisor',
    permissions: [
      PERMISSIONS.ORG_VIEW,
      PERMISSIONS.SHIFT_VIEW,
      PERMISSIONS.SHIFT_EDIT,
      PERMISSIONS.VOLUNTEER_VIEW,
    ],
  },
  {
    name: 'Manager',
    permissions: [
      PERMISSIONS.ORG_VIEW,
      PERMISSIONS.ORG_EDIT,
      PERMISSIONS.SHIFT_VIEW,
      PERMISSIONS.SHIFT_EDIT,
      PERMISSIONS.VOLUNTEER_VIEW,
      PERMISSIONS.VOLUNTEER_EDIT,
    ],
  },
] as const;

const WEEKLY_RRULE = {
  MONDAY: 'FREQ=WEEKLY;BYDAY=MO;WKST=MO',
  WEDNESDAY: 'FREQ=WEEKLY;BYDAY=WE;WKST=MO',
  FRIDAY: 'FREQ=WEEKLY;BYDAY=FR;WKST=MO',
} as const;

const ONE_TIME_RRULE = 'FREQ=DAILY;COUNT=1';

type Database = NodePgDatabase<typeof relations>;

type FixtureUser = {
  id: string;
  email: string;
  name: string;
};

type FixtureOrganization = {
  organizationId: string;
  rootUnitId: string;
  ownerRoleId: string;
  memberRoleId: string;
  roleIdsByName: Map<string, string>;
};

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

const createAuthUser = async (
  db: Database,
  hashedPassword: string,
  input: { email: string; name: string },
): Promise<FixtureUser> => {
  const existing = await db.query.users.findFirst({
    where: { email: input.email },
  });

  if (existing) {
    return { id: existing.id, email: existing.email, name: existing.name };
  }

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

const createStagingOrganization = async (
  db: Database,
  adminUserId: string,
  orgInput: { name: string; slug: string; adminEmail: string },
): Promise<FixtureOrganization> => {
  const allPermissionKeys = Object.values(PERMISSIONS).filter(
    (permission) => !permission.startsWith('org-role:'),
  );

  return db.transaction(async (tx) => {
    const [organization] = await tx
      .insert(schema.organizations)
      .values({
        name: orgInput.name,
        slug: orgInput.slug,
        contactEmail: orgInput.adminEmail,
        description: `Staging organization ${orgInput.name}`,
      })
      .returning();

    if (!organization) {
      throw new Error(`Failed to create ${orgInput.name} organization`);
    }

    const [rootType] = await tx
      .insert(schema.organizationUnitTypes)
      .values({
        organizationId: organization.id,
        name: 'organisation unit',
        description: `organization unit for ${organization.name}`,
        icon: 'building-2',
      })
      .returning();

    if (!rootType) {
      throw new Error(
        `Failed to create organization unit type for ${orgInput.name}`,
      );
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
        address: 'Hauptstraße 1, 10115 Berlin',
      })
      .returning();

    if (!rootUnit) {
      throw new Error(
        `Failed to create root organization unit for ${orgInput.name}`,
      );
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

    if (!ownerRole || !memberRole) {
      throw new Error(`Failed to create internal roles for ${orgInput.name}`);
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

    const [adminMembership] = await tx
      .insert(schema.memberships)
      .values({ userId: adminUserId, organizationUnitId: rootUnit.id })
      .returning();

    if (!adminMembership) {
      throw new Error(`Failed to create admin membership for ${orgInput.name}`);
    }

    await tx.insert(schema.membershipRoles).values({
      membershipId: adminMembership.id,
      roleId: ownerRole.id,
    });

    const roleIdsByName = new Map<string, string>();

    for (const roleDef of ROLE_DEFINITIONS) {
      const [role] = await tx
        .insert(schema.roles)
        .values({
          name: roleDef.name,
          description: `${roleDef.name} role for organization ${organization.name}`,
          isInternal: false,
          organizationId: organization.id,
        })
        .returning();

      if (!role) {
        throw new Error(
          `Failed to create ${roleDef.name} role for ${orgInput.name}`,
        );
      }

      const permissionRows = await tx
        .select({ id: permissions.id })
        .from(permissions)
        .where(inArray(permissions.key, roleDef.permissions));

      if (permissionRows.length > 0) {
        await tx.insert(schema.rolePermissions).values(
          permissionRows.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
          })),
        );
      }

      roleIdsByName.set(roleDef.name, role.id);
    }

    return {
      organizationId: organization.id,
      rootUnitId: rootUnit.id,
      ownerRoleId: ownerRole.id,
      memberRoleId: memberRole.id,
      roleIdsByName,
    };
  });
};

type ShiftFixture = {
  title: string;
  startsAt: Date;
  rrule: string;
  inviteUserIds: string[];
  visibility?: ShiftVisibility;
  maxVolunteers?: number;
  durationMinutes?: number;
  instructions?: string;
  location?: string;
};

const createShiftWithInvites = async (
  db: Database,
  organizationUnitId: string,
  createdById: string,
  shift: ShiftFixture,
): Promise<void> => {
  const durationMinutes = shift.durationMinutes ?? SHIFT_DURATION_MINUTES;

  const [createdShift] = await db
    .insert(schema.shifts)
    .values({
      title: shift.title,
      slug: slugify(`${shift.title}-${crypto.randomUUID()}`),
      instructions: shift.instructions ?? null,
      location: shift.location ?? null,
      organizationUnitId,
      createdById,
      visibility: shift.visibility ?? ShiftVisibility.ALL_MEMBERS,
      maxVolunteers: shift.maxVolunteers ?? null,
      originalStartsAt: shift.startsAt,
      durationMinutes,
      rrule: shift.rrule,
    })
    .returning();

  if (!createdShift) {
    throw new Error(`Failed to create shift: ${shift.title}`);
  }

  const instances = expandShift(shift.rrule, shift.startsAt, durationMinutes);
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
};

const memberEmail = (index: number): { email: string; orgName: string } => {
  const padded = String(index).padStart(3, '0');
  const isOdd = index % 2 === 1;
  const orgName = isOdd ? 'Holi' : 'Clippy';
  const domain = isOdd ? 'holi.social' : 'clippy.social';
  return { email: `member${padded}@${domain}`, orgName };
};

const seedOrganization = async (
  db: Database,
  hashedPassword: string,
  orgInput: { name: string; slug: string; adminEmail: string },
): Promise<{ org: FixtureOrganization; members: FixtureUser[] }> => {
  const existingOrg = await db.query.organizations.findFirst({
    where: { slug: orgInput.slug },
  });

  if (existingOrg) {
    console.log(`Organization ${orgInput.name} already exists; skipping.`);
    return { org: {} as FixtureOrganization, members: [] };
  }

  const admin = await createAuthUser(db, hashedPassword, {
    email: orgInput.adminEmail,
    name: `${orgInput.name} Admin`,
  });

  const org = await createStagingOrganization(db, admin.id, orgInput);

  const members: FixtureUser[] = [];
  for (let index = 1; index <= MEMBER_COUNT; index += 1) {
    const { email, orgName } = memberEmail(index);
    if (orgName !== orgInput.name) {
      continue;
    }

    const member = await createAuthUser(db, hashedPassword, {
      email,
      name: `${orgInput.name} Member ${String(index).padStart(3, '0')}`,
    });

    const [membership] = await db
      .insert(schema.memberships)
      .values({ userId: member.id, organizationUnitId: org.rootUnitId })
      .returning();

    if (!membership) {
      throw new Error(`Failed to create membership for ${email}`);
    }

    const roleName = ROLE_DEFINITIONS[index % ROLE_DEFINITIONS.length].name;
    const roleId = org.roleIdsByName.get(roleName);

    if (!roleId) {
      throw new Error(`Role ${roleName} not found for ${orgInput.name}`);
    }

    await db.insert(schema.membershipRoles).values({
      membershipId: membership.id,
      roleId,
    });

    members.push(member);
  }

  return { org, members };
};

const seedShifts = async (
  db: Database,
  org: FixtureOrganization,
  members: FixtureUser[],
  adminId: string,
): Promise<void> => {
  if (!org.rootUnitId || members.length === 0) {
    return;
  }

  const today = getDateInFixtureTimezone(new Date());
  const mondayAnchor = findWeekdayWeeksAgo(1, 12);
  const wednesdayAnchor = findWeekdayWeeksAgo(3, 12);
  const fridayAnchor = findWeekdayWeeksAgo(5, 12);
  const discoverDay1 = addDaysInFixtureTimezone(
    today.year,
    today.month,
    today.day,
    3,
  );
  const discoverDay2 = addDaysInFixtureTimezone(
    today.year,
    today.month,
    today.day,
    10,
  );

  const memberIds = members.map((member) => member.id);
  const halfCount = Math.ceil(memberIds.length / 2);
  const partialInviteIds = memberIds.slice(0, halfCount);

  await createShiftWithInvites(db, org.rootUnitId, adminId, {
    title: 'Community Support',
    startsAt: fixtureWallClockToUtc(
      mondayAnchor.year,
      mondayAnchor.month,
      mondayAnchor.day,
      8,
    ),
    rrule: WEEKLY_RRULE.MONDAY,
    visibility: ShiftVisibility.ALL_MEMBERS,
    maxVolunteers: memberIds.length + 5,
    instructions:
      'Staff the weekly community desk: check people in, hand out care packages, and point visitors to the right resource table.',
    location: 'Community Center, Front Desk',
    inviteUserIds: memberIds,
  });

  await createShiftWithInvites(db, org.rootUnitId, adminId, {
    title: 'Food Distribution',
    startsAt: fixtureWallClockToUtc(
      wednesdayAnchor.year,
      wednesdayAnchor.month,
      wednesdayAnchor.day,
      12,
    ),
    rrule: WEEKLY_RRULE.WEDNESDAY,
    visibility: ShiftVisibility.ALL_MEMBERS,
    maxVolunteers: partialInviteIds.length + 5,
    instructions:
      'Sort donated groceries into family-sized boxes, then help load them into pickup vehicles.',
    location: 'Community Center, Loading Dock',
    inviteUserIds: partialInviteIds,
  });

  await createShiftWithInvites(db, org.rootUnitId, adminId, {
    title: 'Event Assistance',
    startsAt: fixtureWallClockToUtc(
      fridayAnchor.year,
      fridayAnchor.month,
      fridayAnchor.day,
      16,
    ),
    rrule: WEEKLY_RRULE.FRIDAY,
    visibility: ShiftVisibility.INVITED_MEMBERS,
    maxVolunteers: 8,
    instructions:
      'General support for whatever the Friday program needs that week — registration, signage, seating, or directing attendees.',
    location: 'Community Center, Main Hall',
    inviteUserIds: memberIds.slice(0, 10),
  });

  await createShiftWithInvites(db, org.rootUnitId, adminId, {
    title: 'Park Cleanup Day',
    startsAt: fixtureWallClockToUtc(
      discoverDay1.year,
      discoverDay1.month,
      discoverDay1.day,
      9,
    ),
    rrule: ONE_TIME_RRULE,
    durationMinutes: 180,
    visibility: ShiftVisibility.ALL_MEMBERS,
    maxVolunteers: 15,
    instructions:
      'Pick up litter, clear brush from the walking paths, and help repaint the playground fence.',
    location: 'Tiergarten Park, Berlin · Main gate',
    inviteUserIds: memberIds.slice(0, 8),
  });

  await createShiftWithInvites(db, org.rootUnitId, adminId, {
    title: 'After-School Tutoring',
    startsAt: fixtureWallClockToUtc(
      discoverDay2.year,
      discoverDay2.month,
      discoverDay2.day,
      15,
    ),
    rrule: ONE_TIME_RRULE,
    durationMinutes: 90,
    visibility: ShiftVisibility.ALL_MEMBERS,
    maxVolunteers: 10,
    instructions:
      'Help kids aged 8–12 with homework and reading practice. Materials are provided.',
    location: 'Community Center, Room 2',
    inviteUserIds: memberIds.slice(0, 5),
  });
};

async function seedStagingFixtures() {
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

  let totalMembers = 0;
  let totalShifts = 0;

  for (const orgInput of STAGING_ORGS) {
    const { org, members } = await seedOrganization(
      db,
      hashedPassword,
      orgInput,
    );

    if (!org.rootUnitId || members.length === 0) {
      continue;
    }

    const admin = await db.query.users.findFirst({
      where: { email: orgInput.adminEmail },
    });

    if (!admin) {
      throw new Error(`Admin user not found for ${orgInput.name}`);
    }

    await seedShifts(db, org, members, admin.id);

    totalMembers += members.length;
    totalShifts += 5;

    console.log(
      `Created ${orgInput.name} organization (${org.organizationId}) with ${members.length} members and 5 shifts`,
    );
  }

  console.log(`Seeded ${STAGING_ORGS.length} organizations`);
  console.log(
    `Seeded ${totalMembers} member accounts with password ${FIXTURE_PASSWORD}`,
  );
  console.log(`Seeded ${totalShifts} shifts`);

  await pool.end();
}

seedStagingFixtures().catch((error) => {
  console.error(error);
  process.exit(1);
});
