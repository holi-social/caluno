import { hashPassword } from 'better-auth/crypto';
import { eq, inArray } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DocumentKind, SigneeType } from '../accounting/enums';
import {
  DEFAULT_MEMBER_ROLE_NAME,
  DEFAULT_OWNER_ROLE_NAME,
  MEMBER_DEFAULT_PERMISSIONS,
  PERMISSIONS,
} from '../auth/constants';
import { permissions } from '../auth/schemas/permission.schema';
import { EventInviteStatus } from '../event/enums';
import { MembershipRequestStatus } from '../membership/enums';
import { FieldType } from '../requirement-profile/enums';
import { ShiftInviteStatus, ShiftVisibility } from '../shift/enums';
import { expandShift } from '../shift/utils/rrule-expander';
import { slugify } from '../utils/slug.util';
import { relations } from './relations';
import * as schema from './schema';

process.env.TZ = 'Europe/Berlin';

const FIXTURE_PASSWORD = process.env.FIXTURE_PASSWORD ?? 'abcd1234';
const ORG_NAME = 'Playground';
const ORG_SLUG = 'playground';
const FIXTURE_TIMEZONE = 'Europe/Berlin';
const SHIFT_DURATION_MINUTES = 240;
const RECURRENCE_WEEKS_BACK = 12;

// Stable IDs so e2e specs can rely on fixture data without querying the DB.
const PUBLIC_EVENT_ID = '213e6757-af0c-4ce3-ba29-fb3500309351';
const EVENT_ASSISTANCE_SHIFT_ID = 'e2915169-290d-42b2-a2e2-6d9992bb8814';
const SHOWCASE_EVENT_ID = 'a6f6f1a1-1f2a-4a2a-9c1a-2f6b8b2f9a11';
const SHOWCASE_OPEN_SHIFT_ID = 'b1e2a3c4-5d6e-4f70-8a91-b2c3d4e5f601';
const SHOWCASE_FULL_SHIFT_ID = 'c2f3b4d5-6e7f-4081-9a02-c3d4e5f60712';
const SHOWCASE_UNLIMITED_SHIFT_ID = 'd3a4c5e6-7f80-4192-ab13-d4e5f6071823';

const EVENT_COVER_IMAGE_URL =
  'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?auto=format&fit=crop&w=1200&q=80';
const SHOWCASE_SHIFT_IMAGE_URL =
  'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80';
const ORG_COVER_IMAGE_URL =
  'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?auto=format&fit=crop&w=1200&q=80';
const DEMO_USER_EMAIL = 'testing+demo@caluno.org';

const WEEKLY_RRULE = {
  MONDAY: 'FREQ=WEEKLY;BYDAY=MO;WKST=MO',
  WEDNESDAY: 'FREQ=WEEKLY;BYDAY=WE;WKST=MO',
  FRIDAY: 'FREQ=WEEKLY;BYDAY=FR;WKST=MO',
} as const;

/** A single, non-recurring occurrence — used for the fixed overlap-test shifts below. */
const ONE_TIME_RRULE = 'FREQ=DAILY;COUNT=1';
const OVERLAP_MEMBER_INDEX = 2;

const SUPERVISOR_ROLE_NAME = 'Supervisor';
const SUPERVISOR_PERMISSIONS = [
  PERMISSIONS.ORG_VIEW,
  PERMISSIONS.SHIFT_VIEW,
  PERMISSIONS.SHIFT_EDIT,
  PERMISSIONS.VOLUNTEER_VIEW,
  PERMISSIONS.CHECK_IN_MANAGE,
] as const;

type Database = NodePgDatabase<typeof relations>;

type FixtureUser = {
  id: string;
  email: string;
  name: string;
};

const memberEmail = (index: number): string =>
  `testing+${String(index).padStart(3, '0')}@caluno.org`;

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

const ensureMembershipWithRole = async (
  db: Database,
  userId: string,
  organizationUnitId: string,
  roleId: string,
): Promise<void> => {
  const existingMembership = await db.query.memberships.findFirst({
    where: { userId, organizationUnitId },
  });

  let membershipId: string;

  if (existingMembership) {
    membershipId = existingMembership.id;
  } else {
    const [membership] = await db
      .insert(schema.memberships)
      .values({ userId, organizationUnitId })
      .returning();

    if (!membership) {
      throw new Error('Failed to create membership');
    }

    membershipId = membership.id;
  }

  const existingRole = await db.query.membershipRoles.findFirst({
    where: { membershipId, roleId },
  });

  if (!existingRole) {
    await db.insert(schema.membershipRoles).values({
      membershipId,
      roleId,
    });
  }
};

const ensurePlaygroundOrganization = async (
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

  const existingOrg = await db.query.organizations.findFirst({
    where: { slug: ORG_SLUG },
  });

  if (existingOrg) {
    const rootUnit = await db.query.organizationUnits.findFirst({
      where: { organizationId: existingOrg.id, slug: ORG_SLUG },
    });

    if (!rootUnit) {
      throw new Error(
        'Existing Playground organization is missing its root unit',
      );
    }

    const roles = await db.query.roles.findMany({
      where: { organizationId: existingOrg.id },
    });

    const ownerRole = roles.find(
      (role) => role.name === DEFAULT_OWNER_ROLE_NAME,
    );
    const memberRole = roles.find(
      (role) => role.name === DEFAULT_MEMBER_ROLE_NAME,
    );
    const supervisorRole = roles.find(
      (role) => role.name === SUPERVISOR_ROLE_NAME,
    );

    if (!ownerRole || !memberRole || !supervisorRole) {
      throw new Error(
        'Existing Playground organization is missing expected roles',
      );
    }

    const existingMembership = await db.query.memberships.findFirst({
      where: { userId: adminUserId, organizationUnitId: rootUnit.id },
    });

    if (!existingMembership) {
      const [membership] = await db
        .insert(schema.memberships)
        .values({ userId: adminUserId, organizationUnitId: rootUnit.id })
        .returning();

      if (!membership) {
        throw new Error('Failed to create admin membership');
      }

      await db.insert(schema.membershipRoles).values({
        membershipId: membership.id,
        roleId: ownerRole.id,
      });
    } else {
      const existingRole = await db.query.membershipRoles.findFirst({
        where: { membershipId: existingMembership.id, roleId: ownerRole.id },
      });

      if (!existingRole) {
        await db.insert(schema.membershipRoles).values({
          membershipId: existingMembership.id,
          roleId: ownerRole.id,
        });
      }
    }

    return {
      organizationId: existingOrg.id,
      rootUnitId: rootUnit.id,
      ownerRoleId: ownerRole.id,
      memberRoleId: memberRole.id,
      supervisorRoleId: supervisorRole.id,
    };
  }

  return db.transaction(async (tx) => {
    const [organization] = await tx
      .insert(schema.organizations)
      .values({
        name: ORG_NAME,
        slug: ORG_SLUG,
        contactEmail: 'testing@caluno.org',
        description: 'Local development playground organization',
        address: 'Hauptstraße 1',
        city: 'Berlin',
        zipCode: '10115',
      })
      .returning();

    if (!organization) {
      throw new Error('Failed to create Playground organization');
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
      throw new Error('Failed to create organization unit type');
    }

    const [rootUnit] = await tx
      .insert(schema.organizationUnits)
      .values({
        organizationId: organization.id,
        parentId: null,
        typeId: rootType.id,
        name: organization.name,
        slug: ORG_SLUG,
        contactEmail: organization.contactEmail,
        description: organization.description,
        coverUrl: ORG_COVER_IMAGE_URL,
        address: 'Hauptstraße 1',
        city: 'Berlin',
        zipCode: '10115',
        legalRep: 'Max Mustermann',
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
  /** Defaults to a random UUID. */
  id?: string;
  title: string;
  startsAt: Date;
  rrule: string;
  inviteUserIds: string[];
  /** Defaults to `SHIFT_DURATION_MINUTES`; override for fixed-length overlap-test shifts. */
  durationMinutes?: number;
  /** Associates the shift with an event. */
  eventId?: string;
  /** Defaults to `ShiftVisibility.INVITED_MEMBERS`. */
  visibility?: ShiftVisibility;
  /** Capacity cap; omit for unlimited spots. */
  maxVolunteers?: number;
  instructions?: string;
  location?: string;
  imageUrl?: string;
  /** Invites inserted with this status instead of JOINED (does not count toward capacity). */
  pendingInviteUserIds?: string[];
  /**
   * Invites at explicit statuses (e.g. VOLUNTEER_REJECTED, VOLUNTEER_CANCELLED,
   * WAITLIST_JOINED), seeded to every instance. Only JOINED counts toward capacity.
   */
  extraInvites?: Array<{ userIds: string[]; status: ShiftInviteStatus }>;
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

const ensureShiftWithInvites = async (
  db: Database,
  organizationUnitId: string,
  createdById: string,
  shift: ShiftFixture,
): Promise<{ shiftId: string; instanceId: string; instanceStartsAt: Date }> => {
  const durationMinutes = shift.durationMinutes ?? SHIFT_DURATION_MINUTES;

  const existingShift = shift.id
    ? await db.query.shifts.findFirst({ where: { id: shift.id } })
    : await db.query.shifts.findFirst({
        where: { title: shift.title, organizationUnitId },
      });

  if (existingShift) {
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: existingShift.id },
    });

    const recentInstance = pickRecentPastInstance(instances);

    return {
      shiftId: existingShift.id,
      instanceId: recentInstance.id,
      instanceStartsAt: recentInstance.actualStartsAt,
    };
  }

  const [createdShift] = await db
    .insert(schema.shifts)
    .values({
      id: shift.id,
      title: shift.title,
      slug: slugify(shift.title),
      instructions: shift.instructions ?? null,
      location: shift.location ?? null,
      imageUrl: shift.imageUrl ?? null,
      organizationUnitId,
      createdById,
      visibility: shift.visibility ?? ShiftVisibility.INVITED_MEMBERS,
      maxVolunteers: shift.maxVolunteers ?? null,
      originalStartsAt: shift.startsAt,
      durationMinutes,
      rrule: shift.rrule,
      eventId: shift.eventId ?? null,
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
          status: ShiftInviteStatus.JOINED,
        })),
      ),
    );
  }

  if (shift.pendingInviteUserIds && shift.pendingInviteUserIds.length > 0) {
    await db.insert(schema.shiftInstanceInvites).values(
      insertedInstances.flatMap((instance) =>
        (shift.pendingInviteUserIds ?? []).map((userId) => ({
          instanceId: instance.id,
          userId,
          status: ShiftInviteStatus.ADMIN_INVITED,
        })),
      ),
    );
  }

  for (const group of shift.extraInvites ?? []) {
    if (group.userIds.length === 0) {
      continue;
    }
    await db.insert(schema.shiftInstanceInvites).values(
      insertedInstances.flatMap((instance) =>
        group.userIds.map((userId) => ({
          instanceId: instance.id,
          userId,
          status: group.status,
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

const ensureEvent = async (
  db: Database,
  organizationUnitId: string,
  createdById: string,
  event: {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    coverUrl?: string | null;
    logoUrl?: string | null;
    startsAt: Date;
    endsAt: Date;
  },
): Promise<typeof schema.events.$inferSelect> => {
  const existingEvent = await db.query.events.findFirst({
    where: { id: event.id },
  });

  if (existingEvent) {
    return existingEvent;
  }

  const [createdEvent] = await db
    .insert(schema.events)
    .values({
      id: event.id,
      title: event.title,
      slug: slugify(event.title),
      description: event.description ?? null,
      location: event.location ?? null,
      logoUrl: event.logoUrl ?? null,
      coverUrl: event.coverUrl ?? null,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      organizationUnitId,
      createdById,
    })
    .returning();

  if (!createdEvent) {
    throw new Error(`Failed to create event: ${event.title}`);
  }

  return createdEvent;
};

const ensureTimeEntries = async (
  db: Database,
  approvedMembers: FixtureUser[],
  shiftInstances: {
    communitySupport: { startsAt: Date; instanceId: string };
    foodDistribution: { startsAt: Date; instanceId: string };
  },
  organizationUnitId: string,
): Promise<void> => {
  const instanceIds = [
    shiftInstances.communitySupport.instanceId,
    shiftInstances.foodDistribution.instanceId,
  ];

  const existingEntries = await db.query.timeEntries.findMany({
    where: { shiftInstanceId: { in: instanceIds } },
  });

  if (existingEntries.length > 0) {
    return;
  }

  const entries: Array<typeof schema.timeEntries.$inferInsert> = [];

  for (const [index, member] of approvedMembers.entries()) {
    const memberNumber = index + 1;

    if (member.email === 'testing+supervisor@caluno.org') {
      entries.push({
        shiftInstanceId: shiftInstances.communitySupport.instanceId,
        organizationUnitId,
        volunteerId: member.id,
        startedAt: addHours(shiftInstances.communitySupport.startsAt, 0.5),
        endedAt: addHours(shiftInstances.communitySupport.startsAt, 3.5),
        notes: 'Supervisor coverage',
      });
      entries.push({
        shiftInstanceId: shiftInstances.foodDistribution.instanceId,
        organizationUnitId,
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
      organizationUnitId,
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
        organizationUnitId,
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
        organizationUnitId,
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
        organizationUnitId,
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

const ensurePersonalInformationForm = async (
  db: Database,
  organizationId: string,
  organizationUnitId: string,
  createdById: string,
): Promise<typeof schema.requirementForms.$inferSelect> => {
  let form = await db.query.requirementForms.findFirst({
    where: { organizationId, slug: 'personal-information' },
  });

  if (!form) {
    const [createdForm] = await db
      .insert(schema.requirementForms)
      .values({
        organizationId,
        organizationUnitId,
        slug: 'personal-information',
        name: 'Personal Information',
        description: 'Basic personal details for volunteers.',
        shareToken: crypto.randomUUID(),
        createdBy: createdById,
        updatedBy: createdById,
      })
      .returning();

    if (!createdForm) {
      throw new Error('Failed to create Personal Information form');
    }

    form = createdForm;

    const [block] = await db
      .insert(schema.formBlocks)
      .values({
        organizationId,
        title: 'Personal Information',
        description: 'Required personal details.',
        required: true,
        createdBy: createdById,
        updatedBy: createdById,
      })
      .returning();

    if (!block) {
      throw new Error('Failed to create Personal Information block');
    }

    await db.insert(schema.formBlockFields).values([
      {
        blockId: block.id,
        type: FieldType.TEXT,
        label: 'First name',
        required: true,
        fieldOrder: 0,
      },
      {
        blockId: block.id,
        type: FieldType.TEXT,
        label: 'Last name',
        required: true,
        fieldOrder: 1,
      },
    ]);

    await db.insert(schema.requirementFormBlockRefs).values({
      formId: form.id,
      blockId: block.id,
      fieldOrder: 0,
      required: true,
    });
  }

  const existingUnitRequiredForm =
    await db.query.organizationUnitRequiredForms.findFirst({
      where: { organizationUnitId, formId: form.id },
    });

  if (!existingUnitRequiredForm) {
    await db.insert(schema.organizationUnitRequiredForms).values({
      organizationUnitId,
      formId: form.id,
      order: 0,
    });
  }

  return form;
};

const ensureBankingInformationForm = async (
  db: Database,
  organizationId: string,
  organizationUnitId: string,
  createdById: string,
  shiftId: string,
): Promise<typeof schema.requirementForms.$inferSelect> => {
  let form = await db.query.requirementForms.findFirst({
    where: { organizationId, slug: 'banking-information' },
  });

  if (!form) {
    const [createdForm] = await db
      .insert(schema.requirementForms)
      .values({
        organizationId,
        organizationUnitId,
        slug: 'banking-information',
        name: 'Banking Information',
        description: 'Bank account details for reimbursements.',
        shareToken: crypto.randomUUID(),
        createdBy: createdById,
        updatedBy: createdById,
      })
      .returning();

    if (!createdForm) {
      throw new Error('Failed to create Banking Information form');
    }

    form = createdForm;

    const [block] = await db
      .insert(schema.formBlocks)
      .values({
        organizationId,
        title: 'Banking Information',
        description: 'Bank account details.',
        required: true,
        createdBy: createdById,
        updatedBy: createdById,
      })
      .returning();

    if (!block) {
      throw new Error('Failed to create Banking Information block');
    }

    await db.insert(schema.formBlockFields).values([
      {
        blockId: block.id,
        type: FieldType.IBAN,
        label: 'IBAN',
        systemKey: 'iban',
        required: true,
        fieldOrder: 0,
      },
      {
        blockId: block.id,
        type: FieldType.TEXT,
        label: 'BIC',
        systemKey: 'bic',
        required: true,
        fieldOrder: 1,
      },
    ]);

    await db.insert(schema.requirementFormBlockRefs).values({
      formId: form.id,
      blockId: block.id,
      fieldOrder: 0,
      required: true,
    });
  }

  const existingShiftRequiredForm = await db.query.shiftRequiredForms.findFirst(
    {
      where: { shiftId, formId: form.id },
    },
  );

  if (!existingShiftRequiredForm) {
    await db.insert(schema.shiftRequiredForms).values({
      shiftId,
      formId: form.id,
      order: 0,
    });
  }

  return form;
};

const ensureCodeOfConductForm = async (
  db: Database,
  organizationId: string,
  organizationUnitId: string,
  createdById: string,
  eventId: string,
): Promise<typeof schema.requirementForms.$inferSelect> => {
  let form = await db.query.requirementForms.findFirst({
    where: { organizationId, slug: 'code-of-conduct' },
  });

  if (!form) {
    const [createdForm] = await db
      .insert(schema.requirementForms)
      .values({
        organizationId,
        organizationUnitId,
        slug: 'code-of-conduct',
        name: 'Code of Conduct',
        description: 'Acknowledge the volunteer code of conduct.',
        shareToken: crypto.randomUUID(),
        createdBy: createdById,
        updatedBy: createdById,
      })
      .returning();

    if (!createdForm) {
      throw new Error('Failed to create Code of Conduct form');
    }

    form = createdForm;

    const [block] = await db
      .insert(schema.formBlocks)
      .values({
        organizationId,
        title: 'Code of Conduct',
        description: 'Please acknowledge our code of conduct.',
        required: true,
        createdBy: createdById,
        updatedBy: createdById,
      })
      .returning();

    if (!block) {
      throw new Error('Failed to create Code of Conduct block');
    }

    await db.insert(schema.formBlockFields).values({
      blockId: block.id,
      type: FieldType.CHECKBOX,
      label: 'I agree to follow the Code of Conduct',
      required: true,
      fieldOrder: 0,
    });

    await db.insert(schema.requirementFormBlockRefs).values({
      formId: form.id,
      blockId: block.id,
      fieldOrder: 0,
      required: true,
    });
  }

  const existingEventRequiredForm = await db.query.eventRequiredForms.findFirst(
    {
      where: { eventId, formId: form.id },
    },
  );

  if (!existingEventRequiredForm) {
    await db.insert(schema.eventRequiredForms).values({
      eventId,
      formId: form.id,
      order: 0,
    });
  }

  return form;
};

/**
 * Seeds default contract + invoice document templates for an org (both
 * Pauschale reimbursement types) with the standard volunteer →
 * permission-holder signee chain. Runs on every `db:fixtures` (bootstrap and
 * staging) for every accounting-enabled organization, so a freshly provisioned
 * org never hits "No contract template configured for reimbursement type …" —
 * the coordinator can create documents out of the box and customize the
 * templates in the builder afterwards.
 *
 * The body is a minimal but renderable contract/invoice template. Existing
 * org-default templates are left untouched so an org's hand-built templates
 * win.
 */
const ensureAccountingDocumentTemplates = async (
  db: Database,
  organizationId: string,
): Promise<void> => {
  const accountingManagePermission = await db.query.permissions.findFirst({
    where: { key: PERMISSIONS.ACCOUNTING_MANAGE },
  });

  const reimbursementTypes = await db.query.reimbursementTypes.findMany();

  const contractBody = {
    header: {
      titleLines: ['Zusatzvereinbarung zur', 'Aufwandsentschädigung'],
      orgIdentityLine: {
        id: 'header-org-identity',
        text: '{orgName} {orgAddress}',
        fields: [
          {
            id: 'header-org-name',
            value: { kind: 'bound', source: 'org_name' },
          },
          {
            id: 'header-org-address',
            value: { kind: 'bound', source: 'org_address' },
          },
        ],
        enabled: true,
      },
    },
    blocks: [
      {
        id: 'payout',
        kind: 'text',
        title: 'Auszahlung',
        lines: [
          {
            id: 'iban-line',
            text: 'IBAN: {volunteerIban}',
            fields: [
              {
                id: 'iban-field',
                value: { kind: 'bound', source: 'volunteer_iban' },
              },
            ],
            enabled: true,
          },
          {
            id: 'bic-line',
            text: 'BIC: {volunteerBic}',
            fields: [
              {
                id: 'bic-field',
                value: { kind: 'bound', source: 'volunteer_bic' },
              },
            ],
            enabled: true,
          },
        ],
        enabled: true,
      },
    ],
    footer: {
      closingLine: {
        id: 'closing',
        text: 'Vielen Dank',
        fields: [],
        enabled: true,
      },
    },
  };

  const invoiceBody = {
    header: {
      titleLines: ['Stundennachweis'],
      orgIdentityLine: {
        id: 'header-org-identity',
        text: '{orgName} {orgAddress}',
        fields: [
          {
            id: 'header-org-name',
            value: { kind: 'bound', source: 'org_name' },
          },
          {
            id: 'header-org-address',
            value: { kind: 'bound', source: 'org_address' },
          },
        ],
        enabled: true,
      },
    },
    blocks: [],
    footer: {
      closingLine: {
        id: 'closing',
        text: 'Vielen Dank',
        fields: [],
        enabled: true,
      },
    },
  };

  const signees = (permissionId: string | undefined) => [
    { order: 0, signeeType: SigneeType.VOLUNTEER, requiredPermissionId: null },
    ...(permissionId
      ? [
          {
            order: 1,
            signeeType: SigneeType.PERMISSION_HOLDER,
            requiredPermissionId: permissionId,
          },
        ]
      : []),
  ];

  for (const type of reimbursementTypes) {
    for (const kind of [DocumentKind.CONTRACT, DocumentKind.INVOICE]) {
      // A template exists already (org-default for this type+kind) — leave it.
      const existing = await db.query.documentTemplates.findFirst({
        where: {
          organizationId,
          organizationUnitId: { isNull: true },
          reimbursementTypeId: type.id,
          kind,
          isDeleted: false,
        },
      });
      if (existing) continue;

      const [template] = await db
        .insert(schema.documentTemplates)
        .values({
          organizationId,
          organizationUnitId: null,
          reimbursementTypeId: type.id,
          kind,
          body: kind === DocumentKind.CONTRACT ? contractBody : invoiceBody,
          isDeleted: false,
        })
        .returning();

      if (!template) {
        throw new Error(
          `Failed to create ${kind} template for reimbursement type ${type.key}`,
        );
      }

      await db.insert(schema.templateSignees).values(
        signees(accountingManagePermission?.id).map((signee) => ({
          documentTemplateId: template.id,
          order: signee.order,
          signeeType: signee.signeeType,
          requiredPermissionId: signee.requiredPermissionId,
        })),
      );
    }
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
    email: 'testing+admin@caluno.org',
    name: 'Playground Admin',
  });

  const org = await ensurePlaygroundOrganization(db, admin.id);

  await ensurePersonalInformationForm(
    db,
    org.organizationId,
    org.rootUnitId,
    admin.id,
  );

  const supervisor = await createAuthUser(db, hashedPassword, {
    email: 'testing+supervisor@caluno.org',
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

  // The account to log into for demos: a member with existing shift/event
  // invites plus untouched ALL_MEMBERS shifts left to discover, so both the
  // "my shifts" and "discover" flows have real content on first login.
  const demoUser = await createAuthUser(db, hashedPassword, {
    email: DEMO_USER_EMAIL,
    name: 'Demo Volunteer',
  });

  await ensureMembershipWithRole(
    db,
    supervisor.id,
    org.rootUnitId,
    org.supervisorRoleId,
  );

  await ensureMembershipWithRole(
    db,
    demoUser.id,
    org.rootUnitId,
    org.memberRoleId,
  );

  for (const member of members) {
    await ensureMembershipWithRole(
      db,
      member.id,
      org.rootUnitId,
      org.memberRoleId,
    );
  }

  const pendingUsers = await Promise.all(
    ['testing+pending01@caluno.org', 'testing+pending02@caluno.org'].map(
      (email, index) =>
        createAuthUser(db, hashedPassword, {
          email,
          name: `Pending Applicant ${String(index + 1).padStart(2, '0')}`,
        }),
    ),
  );

  const rejectedUser = await createAuthUser(db, hashedPassword, {
    email: 'testing+rejected01@caluno.org',
    name: 'Rejected Applicant',
  });

  // The document signing chain requires the volunteer's bank/personal profile
  // fields before a contract/invoice can be signed (otherwise the rendered
  // PDF comes out with gaps). Seed a complete profile for the members so the
  // fixture accounts can sign documents out of the box.
  for (const [index, member] of members.entries()) {
    const existing = await db.query.userProfiles.findFirst({
      where: { userId: member.id },
    });
    if (!existing) {
      await db.insert(schema.userProfiles).values({
        userId: member.id,
        data: {
          // A valid German IBAN (mod-97 checksum). Same account for the
          // fixture members so it round-trips the validator.
          iban: 'DE89 3704 0044 0532 0130 00',
          bic: 'COBADEFFXXX',
          address: `Musterstraße ${index + 1}`,
          'birth-date': '1990-08-02',
        },
      });
    }
  }

  const ensureMembershipRequest = async (
    userId: string,
    status: MembershipRequestStatus,
    extra: Partial<typeof schema.membershipRequests.$inferInsert> = {},
  ): Promise<void> => {
    const existing = await db.query.membershipRequests.findFirst({
      where: {
        userId,
        organizationUnitId: org.rootUnitId,
      },
    });

    if (!existing) {
      await db.insert(schema.membershipRequests).values({
        userId,
        organizationUnitId: org.rootUnitId,
        status,
        ...extra,
      });
    }
  };

  for (const user of pendingUsers) {
    await ensureMembershipRequest(user.id, MembershipRequestStatus.PENDING);
  }

  await ensureMembershipRequest(
    rejectedUser.id,
    MembershipRequestStatus.REJECTED,
    {
      reviewedById: admin.id,
      reviewedAt: new Date(),
      rejectionReason: 'Fixture rejected applicant',
    },
  );

  const approvedUserIds = [
    admin.id,
    supervisor.id,
    demoUser.id,
    ...members.map((member) => member.id),
  ];

  const partialInviteUserIds = [
    supervisor.id,
    demoUser.id,
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

  const publicEvent = await ensureEvent(db, org.rootUnitId, admin.id, {
    id: PUBLIC_EVENT_ID,
    title: 'Public Test Event',
    description:
      'A recurring weekly program at the Playground Community Center: community support on Mondays, food distribution on Wednesdays, and general event assistance on Fridays.',
    location: 'Playground Community Center, Hauptstraße 1, 10115 Berlin',
    coverUrl: ORG_COVER_IMAGE_URL,
    startsAt: communitySupportStart,
    endsAt: addHours(eventAssistanceStart, SHIFT_DURATION_MINUTES / 60 + 4),
  });

  const communitySupport = await ensureShiftWithInvites(
    db,
    org.rootUnitId,
    admin.id,
    {
      title: 'Community Support',
      startsAt: communitySupportStart,
      rrule: WEEKLY_RRULE.MONDAY,
      visibility: ShiftVisibility.ALL_MEMBERS,
      maxVolunteers: approvedUserIds.length + 3,
      instructions:
        'Staff the weekly community desk: check people in, hand out care packages, and point visitors to the right resource table. A short briefing runs 15 minutes before the desk opens.',
      location: 'Playground Community Center, Front Desk',
      imageUrl: SHOWCASE_SHIFT_IMAGE_URL,
      inviteUserIds: approvedUserIds,
    },
  );

  const foodDistribution = await ensureShiftWithInvites(
    db,
    org.rootUnitId,
    admin.id,
    {
      title: 'Food Distribution',
      startsAt: foodDistributionStart,
      rrule: WEEKLY_RRULE.WEDNESDAY,
      visibility: ShiftVisibility.ALL_MEMBERS,
      maxVolunteers: partialInviteUserIds.length + 5,
      instructions:
        'Sort donated groceries into family-sized boxes, then help load them into pickup vehicles at the loading dock. Closed-toe shoes required.',
      location: 'Playground Community Center, Loading Dock B',
      imageUrl: EVENT_COVER_IMAGE_URL,
      inviteUserIds: partialInviteUserIds,
    },
  );

  await ensureShiftWithInvites(db, org.rootUnitId, admin.id, {
    id: EVENT_ASSISTANCE_SHIFT_ID,
    title: 'Event Assistance',
    startsAt: eventAssistanceStart,
    rrule: WEEKLY_RRULE.FRIDAY,
    visibility: ShiftVisibility.ALL_MEMBERS,
    maxVolunteers: 8,
    instructions:
      'General support for whatever the Friday program needs that week — registration, signage, seating, or directing attendees. Great shift for new volunteers.',
    location: 'Playground Community Center, Main Hall',
    imageUrl: SHOWCASE_SHIFT_IMAGE_URL,
    inviteUserIds: [
      demoUser.id,
      ...members.slice(4, 7).map((member) => member.id),
    ],
    eventId: publicEvent.id,
  });

  // Showcase fixtures for the public shift/event detail pages: a single
  // event carrying three shifts that between them cover every capacity
  // state the design calls for (open with a partial progress bar, fully
  // booked with no CTA, and unlimited spots), plus a cover image, a pending
  // (not-yet-accepted) invite, and instructions/location text on every shift.
  const showcaseToday = getDateInFixtureTimezone(new Date());
  const showcaseAnchor = addDaysInFixtureTimezone(
    showcaseToday.year,
    showcaseToday.month,
    showcaseToday.day,
    5,
  );

  const showcaseOpenStart = fixtureWallClockToUtc(
    showcaseAnchor.year,
    showcaseAnchor.month,
    showcaseAnchor.day,
    9,
  );
  const showcaseFullStart = fixtureWallClockToUtc(
    showcaseAnchor.year,
    showcaseAnchor.month,
    showcaseAnchor.day,
    14,
  );
  const showcaseUnlimitedDay = addDaysInFixtureTimezone(
    showcaseAnchor.year,
    showcaseAnchor.month,
    showcaseAnchor.day,
    2,
  );
  const showcaseUnlimitedStart = fixtureWallClockToUtc(
    showcaseUnlimitedDay.year,
    showcaseUnlimitedDay.month,
    showcaseUnlimitedDay.day,
    10,
  );

  const showcaseEvent = await ensureEvent(db, org.rootUnitId, admin.id, {
    id: SHOWCASE_EVENT_ID,
    title: 'Volunteer Fair',
    description:
      'A showcase event bringing together every shift capacity state: open with spots left, fully booked, and unlimited. Come see the whole program in one place.',
    location: 'Playground Exhibition Hall, Hauptstraße 1, 10115 Berlin',
    coverUrl: EVENT_COVER_IMAGE_URL,
    startsAt: showcaseOpenStart,
    endsAt: addHours(showcaseFullStart, SHIFT_DURATION_MINUTES / 60),
  });

  await ensureCodeOfConductForm(
    db,
    org.organizationId,
    org.rootUnitId,
    admin.id,
    showcaseEvent.id,
  );

  const showcaseOpenInviteIds = [
    supervisor.id,
    ...members.slice(0, 7).map((member) => member.id),
  ];
  await ensureShiftWithInvites(db, org.rootUnitId, admin.id, {
    id: SHOWCASE_OPEN_SHIFT_ID,
    title: 'Welcome Desk',
    startsAt: showcaseOpenStart,
    rrule: ONE_TIME_RRULE,
    durationMinutes: SHIFT_DURATION_MINUTES,
    visibility: ShiftVisibility.ALL_MEMBERS,
    maxVolunteers: 12,
    instructions:
      'Greet arriving volunteers, hand out name badges, and point them to their assigned stations. No experience needed — a quick briefing happens on site.',
    location: 'Hauptstraße 1, 10115 Berlin · Main entrance',
    imageUrl: SHOWCASE_SHIFT_IMAGE_URL,
    eventId: showcaseEvent.id,
    inviteUserIds: showcaseOpenInviteIds,
    pendingInviteUserIds: [pendingUsers[0]?.id].filter((id): id is string =>
      Boolean(id),
    ),
  });

  await ensureBankingInformationForm(
    db,
    org.organizationId,
    org.rootUnitId,
    admin.id,
    SHOWCASE_OPEN_SHIFT_ID,
  );

  const showcaseFullInviteIds = [
    admin.id,
    supervisor.id,
    ...members.slice(0, 4).map((member) => member.id),
  ];
  await ensureShiftWithInvites(db, org.rootUnitId, admin.id, {
    id: SHOWCASE_FULL_SHIFT_ID,
    title: 'Stage Setup',
    startsAt: showcaseFullStart,
    rrule: ONE_TIME_RRULE,
    durationMinutes: SHIFT_DURATION_MINUTES,
    visibility: ShiftVisibility.ALL_MEMBERS,
    maxVolunteers: showcaseFullInviteIds.length,
    instructions:
      'Build the stage, run sound checks, and set up seating for the afternoon program.',
    location: 'Hauptstraße 1, 10115 Berlin · Exhibition Hall B',
    imageUrl: EVENT_COVER_IMAGE_URL,
    eventId: showcaseEvent.id,
    inviteUserIds: showcaseFullInviteIds,
  });

  await ensureShiftWithInvites(db, org.rootUnitId, admin.id, {
    id: SHOWCASE_UNLIMITED_SHIFT_ID,
    title: 'Cleanup Crew',
    startsAt: showcaseUnlimitedStart,
    rrule: ONE_TIME_RRULE,
    durationMinutes: SHIFT_DURATION_MINUTES,
    visibility: ShiftVisibility.ALL_MEMBERS,
    instructions:
      'Help break down the exhibition hall after the fair: fold tables, bag trash, and load the van. As many hands as show up — no cap.',
    location: 'Hauptstraße 1, 10115 Berlin · Exhibition Hall B',
    imageUrl: SHOWCASE_SHIFT_IMAGE_URL,
    eventId: showcaseEvent.id,
    inviteUserIds: [members[8]?.id, members[9]?.id].filter((id): id is string =>
      Boolean(id),
    ),
  });

  // Demo account follows the Volunteer Fair (so the event page shows the
  // "You're helping" state) but not the Public Test Event, so both the
  // followed and not-yet-followed states are there to demo.
  const existingEventInvite = await db.query.eventInvites.findFirst({
    where: { eventId: showcaseEvent.id, userId: demoUser.id },
  });

  if (!existingEventInvite) {
    await db.insert(schema.eventInvites).values({
      eventId: showcaseEvent.id,
      userId: demoUser.id,
      status: EventInviteStatus.JOINED,
    });
  }

  // Standalone ALL_MEMBERS shifts spread across the next few weeks, left
  // un-invited for the demo account so /discover has real content on
  // several different upcoming days, not just the showcase event's two.
  const discoverDay = (daysOut: number) =>
    addDaysInFixtureTimezone(
      showcaseToday.year,
      showcaseToday.month,
      showcaseToday.day,
      daysOut,
    );

  const parkCleanupDay = discoverDay(1);
  const warehouseSortingDay = discoverDay(3);
  const tutoringDay = discoverDay(11);
  const gardenDay = discoverDay(18);

  await ensureShiftWithInvites(db, org.rootUnitId, admin.id, {
    title: 'Park Cleanup Day',
    startsAt: fixtureWallClockToUtc(
      parkCleanupDay.year,
      parkCleanupDay.month,
      parkCleanupDay.day,
      9,
    ),
    rrule: ONE_TIME_RRULE,
    durationMinutes: 180,
    visibility: ShiftVisibility.ALL_MEMBERS,
    maxVolunteers: 15,
    instructions:
      'Pick up litter, clear brush from the walking paths, and help repaint the playground fence. Gloves and bags provided — wear clothes you don’t mind getting dirty.',
    location: 'Tiergarten Park, Berlin · Main gate',
    imageUrl: SHOWCASE_SHIFT_IMAGE_URL,
    inviteUserIds: members.slice(0, 2).map((member) => member.id),
  });

  await ensureShiftWithInvites(db, org.rootUnitId, admin.id, {
    title: 'Warehouse Sorting',
    startsAt: fixtureWallClockToUtc(
      warehouseSortingDay.year,
      warehouseSortingDay.month,
      warehouseSortingDay.day,
      13,
    ),
    rrule: ONE_TIME_RRULE,
    durationMinutes: 210,
    visibility: ShiftVisibility.ALL_MEMBERS,
    maxVolunteers: 8,
    instructions:
      'Sort incoming donation pallets by category, check items for damage, and restock the shelves ready for next week’s distribution.',
    location: 'Playground Warehouse, Hauptstraße 1, 10115 Berlin',
    imageUrl: EVENT_COVER_IMAGE_URL,
    inviteUserIds: members.slice(2, 4).map((member) => member.id),
  });

  await ensureShiftWithInvites(db, org.rootUnitId, admin.id, {
    title: 'After-School Tutoring',
    startsAt: fixtureWallClockToUtc(
      tutoringDay.year,
      tutoringDay.month,
      tutoringDay.day,
      15,
    ),
    rrule: ONE_TIME_RRULE,
    durationMinutes: 90,
    visibility: ShiftVisibility.ALL_MEMBERS,
    instructions:
      'Help kids aged 8–12 with homework and reading practice. No teaching experience needed, just patience and a friendly face — materials are provided.',
    location: 'Playground Community Center, Room 2',
    imageUrl: SHOWCASE_SHIFT_IMAGE_URL,
    inviteUserIds: members.slice(4, 5).map((member) => member.id),
  });

  await ensureShiftWithInvites(db, org.rootUnitId, admin.id, {
    title: 'Community Garden Planting',
    startsAt: fixtureWallClockToUtc(
      gardenDay.year,
      gardenDay.month,
      gardenDay.day,
      10,
    ),
    rrule: ONE_TIME_RRULE,
    durationMinutes: 150,
    visibility: ShiftVisibility.ALL_MEMBERS,
    maxVolunteers: 10,
    instructions:
      'Plant the spring vegetable beds, turn compost, and set up the new watering system. Great outdoor shift for beginners.',
    location: 'Playground Community Garden, Hauptstraße 1, 10115 Berlin',
    imageUrl: EVENT_COVER_IMAGE_URL,
    inviteUserIds: members.slice(5, 7).map((member) => member.id),
  });

  // --- Invite-response scenarios for the demo volunteer (VOLI-839) ---
  // Give the demo account a full spread of shift invites so the volunteer
  // invitation flows have real content on first login: a paginating set of
  // pending invites (the home preview caps at 10, "See all" reveals the rest),
  // a recurring pending invite (day picker on the detail), plus one shift in
  // each terminal invite state.
  const pendingInviteShifts: Array<{
    title: string;
    location: string;
    hour: number;
    maxVolunteers?: number;
  }> = [
    {
      title: 'Soup Kitchen Service',
      location: 'Community Center · Kitchen',
      hour: 11,
      maxVolunteers: 6,
    },
    {
      title: 'Clothing Bank Sorting',
      location: 'Hauptstraße 1 · Storeroom',
      hour: 14,
      maxVolunteers: 8,
    },
    {
      title: 'Senior Home Visit',
      location: 'Lindenhof Residence',
      hour: 10,
      maxVolunteers: 4,
    },
    {
      title: 'Bike Repair Workshop',
      location: 'Community Garage',
      hour: 15,
      maxVolunteers: 5,
    },
    {
      title: 'Library Reading Hour',
      location: 'Public Library · Room 3',
      hour: 16,
      maxVolunteers: 3,
    },
    {
      title: 'Food Bank Packing',
      location: 'Playground Warehouse',
      hour: 9,
      maxVolunteers: 10,
    },
    {
      title: 'Beach Cleanup',
      location: 'Wannsee Shore',
      hour: 8,
      maxVolunteers: 20,
    },
    {
      title: 'Homework Helpers',
      location: 'Community Center · Room 2',
      hour: 15,
      maxVolunteers: 6,
    },
    {
      title: 'Blood Drive Support',
      location: 'Town Hall Foyer',
      hour: 12,
      maxVolunteers: 8,
    },
  ];

  for (const [index, entry] of pendingInviteShifts.entries()) {
    const day = discoverDay(2 + index);
    await ensureShiftWithInvites(db, org.rootUnitId, admin.id, {
      title: entry.title,
      startsAt: fixtureWallClockToUtc(day.year, day.month, day.day, entry.hour),
      rrule: ONE_TIME_RRULE,
      durationMinutes: SHIFT_DURATION_MINUTES,
      visibility: ShiftVisibility.INVITED_MEMBERS,
      maxVolunteers: entry.maxVolunteers,
      location: entry.location,
      imageUrl: SHOWCASE_SHIFT_IMAGE_URL,
      inviteUserIds: [],
      pendingInviteUserIds: [demoUser.id],
    });
  }

  // Recurring pending invite (weekly x3) — exercises the day picker on the
  // invite detail and brings the pending total to 12.
  const recurringPendingDay = discoverDay(4);
  await ensureShiftWithInvites(db, org.rootUnitId, admin.id, {
    title: 'Weekly Meal Prep',
    startsAt: fixtureWallClockToUtc(
      recurringPendingDay.year,
      recurringPendingDay.month,
      recurringPendingDay.day,
      17,
    ),
    rrule: 'FREQ=WEEKLY;COUNT=3',
    durationMinutes: SHIFT_DURATION_MINUTES,
    visibility: ShiftVisibility.INVITED_MEMBERS,
    maxVolunteers: 6,
    location: 'Community Center · Kitchen',
    imageUrl: EVENT_COVER_IMAGE_URL,
    inviteUserIds: [],
    pendingInviteUserIds: [demoUser.id],
  });

  // Terminal invite states. JOINED surfaces under "Your shifts";
  // VOLUNTEER_REJECTED and VOLUNTEER_CANCELLED are filtered off home but remain
  // reachable at their shift-detail URL (logged in the fixtures summary) to
  // demo the joined/declined/cancelled detail states directly.
  const acceptedDay = discoverDay(5);
  const acceptedInvite = await ensureShiftWithInvites(
    db,
    org.rootUnitId,
    admin.id,
    {
      title: 'Welcome Desk',
      startsAt: fixtureWallClockToUtc(
        acceptedDay.year,
        acceptedDay.month,
        acceptedDay.day,
        9,
      ),
      rrule: ONE_TIME_RRULE,
      durationMinutes: SHIFT_DURATION_MINUTES,
      visibility: ShiftVisibility.INVITED_MEMBERS,
      maxVolunteers: 5,
      location: 'Town Hall Foyer',
      inviteUserIds: [demoUser.id],
    },
  );

  const declinedDay = discoverDay(6);
  const declinedInvite = await ensureShiftWithInvites(
    db,
    org.rootUnitId,
    admin.id,
    {
      title: 'Night Shelter Shift',
      startsAt: fixtureWallClockToUtc(
        declinedDay.year,
        declinedDay.month,
        declinedDay.day,
        20,
      ),
      rrule: ONE_TIME_RRULE,
      durationMinutes: SHIFT_DURATION_MINUTES,
      visibility: ShiftVisibility.INVITED_MEMBERS,
      maxVolunteers: 4,
      location: 'City Shelter',
      inviteUserIds: [],
      extraInvites: [
        {
          userIds: [demoUser.id],
          status: ShiftInviteStatus.VOLUNTEER_REJECTED,
        },
      ],
    },
  );

  const cancelledDay = discoverDay(7);
  const cancelledInvite = await ensureShiftWithInvites(
    db,
    org.rootUnitId,
    admin.id,
    {
      title: 'Fundraiser Setup',
      startsAt: fixtureWallClockToUtc(
        cancelledDay.year,
        cancelledDay.month,
        cancelledDay.day,
        13,
      ),
      rrule: ONE_TIME_RRULE,
      durationMinutes: SHIFT_DURATION_MINUTES,
      visibility: ShiftVisibility.INVITED_MEMBERS,
      maxVolunteers: 6,
      location: 'Exhibition Hall B',
      inviteUserIds: [],
      extraInvites: [
        {
          userIds: [demoUser.id],
          status: ShiftInviteStatus.VOLUNTEER_CANCELLED,
        },
      ],
    },
  );

  const selfJoinedDay = discoverDay(8);
  const selfJoinedShift = await ensureShiftWithInvites(
    db,
    org.rootUnitId,
    admin.id,
    {
      title: 'Open Garden Day',
      startsAt: fixtureWallClockToUtc(
        selfJoinedDay.year,
        selfJoinedDay.month,
        selfJoinedDay.day,
        10,
      ),
      rrule: ONE_TIME_RRULE,
      durationMinutes: SHIFT_DURATION_MINUTES,
      visibility: ShiftVisibility.ALL_MEMBERS,
      maxVolunteers: 12,
      location: 'Community Garden',
      inviteUserIds: [],
      extraInvites: [
        { userIds: [demoUser.id], status: ShiftInviteStatus.JOINED },
      ],
    },
  );

  // Fixed, one-time overlap-test shifts for the my-shifts conflict-clustering
  // UI (a 2-shift "pair" and a 3-shift "pile"), invited to a single member
  // (not member01, which other tests use as the "no conflicts" baseline).
  // Anchored `today + N days` rather than a weekday, so they land a stable
  // number of days out regardless of which day fixtures happen to run on.
  const overlapMember = members[OVERLAP_MEMBER_INDEX - 1];
  if (!overlapMember) {
    throw new Error(
      `No member at index ${OVERLAP_MEMBER_INDEX} for overlap fixtures`,
    );
  }

  // +2/+9 days are chosen so that, as of when this comment was written, they
  // land on days with no other recurring shift invited to this member
  // (Community Support is Monday, Food Distribution is Wednesday) — keeping
  // the pair/pile clusters below exactly 2 and 3 shifts. If fixtures are
  // reseeded on a date where +2/+9 happens to fall on Mon/Wed, the affected
  // cluster picks up that recurring shift too — still a valid (larger)
  // conflict cluster, just not the minimal pair/pile example.
  const today = getDateInFixtureTimezone(new Date());
  const pairDay = addDaysInFixtureTimezone(
    today.year,
    today.month,
    today.day,
    2,
  );
  const pileDay = addDaysInFixtureTimezone(
    today.year,
    today.month,
    today.day,
    9,
  );

  await ensureShiftWithInvites(db, org.rootUnitId, admin.id, {
    title: 'Overlap Test Pair A',
    startsAt: fixtureWallClockToUtc(
      pairDay.year,
      pairDay.month,
      pairDay.day,
      10,
    ),
    rrule: ONE_TIME_RRULE,
    durationMinutes: 240,
    inviteUserIds: [overlapMember.id],
  });
  await ensureShiftWithInvites(db, org.rootUnitId, admin.id, {
    title: 'Overlap Test Pair B',
    startsAt: fixtureWallClockToUtc(
      pairDay.year,
      pairDay.month,
      pairDay.day,
      10,
      30,
    ),
    rrule: ONE_TIME_RRULE,
    durationMinutes: 210,
    inviteUserIds: [overlapMember.id],
  });

  // 6 shifts (> the 5-visible-before-collapsing threshold in
  // my-shifts-day-rows.tsx), each starting 30min after the previous with a
  // 2h duration — a chained overlap where every shift overlaps its neighbor,
  // so the sweep-line clusterer groups all 6 together.
  const PILE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
  for (const [index, letter] of PILE_LETTERS.entries()) {
    await ensureShiftWithInvites(db, org.rootUnitId, admin.id, {
      title: `Overlap Test Pile ${letter}`,
      startsAt: fixtureWallClockToUtc(
        pileDay.year,
        pileDay.month,
        pileDay.day,
        8 + Math.floor(index / 2),
        (index % 2) * 30,
      ),
      rrule: ONE_TIME_RRULE,
      durationMinutes: 120,
      inviteUserIds: [overlapMember.id],
    });
  }

  await ensureTimeEntries(
    db,
    [supervisor, ...members],
    {
      communitySupport: {
        startsAt: communitySupport.instanceStartsAt,
        instanceId: communitySupport.instanceId,
      },
      foodDistribution: {
        startsAt: foodDistribution.instanceStartsAt,
        instanceId: foodDistribution.instanceId,
      },
    },
    org.rootUnitId,
  );

  console.log(`Created Playground organization (${org.organizationId})`);
  console.log(`Root unit: ${org.rootUnitId}`);
  console.log(
    'Users: 16 accounts seeded (password from FIXTURE_PASSWORD, default: abcd1234)',
  );
  console.log('Memberships: 13 approved, 2 pending, 1 rejected');
  console.log(
    'Requirement forms: Personal Information (org unit), Banking Information (Welcome Desk shift), Code of Conduct (Volunteer Fair event)',
  );
  console.log(
    `Demo account: ${DEMO_USER_EMAIL} — member with invited shifts (Community Support, Food Distribution, Event Assistance), follows Volunteer Fair, and has Welcome Desk/Stage Setup/Cleanup Crew plus 4 more shifts across the next 3 weeks left to discover`,
  );
  console.log(
    'Shifts: Community Support (Mon), Food Distribution (Wed), Event Assistance (Fri)',
  );
  console.log(`Event: Public Test Event (${publicEvent.id})`);
  console.log(
    `Event: Volunteer Fair (${showcaseEvent.id}) — Welcome Desk (open, ${showcaseOpenInviteIds.length}/12), Stage Setup (full, ${showcaseFullInviteIds.length}/${showcaseFullInviteIds.length}), Cleanup Crew (unlimited)`,
  );
  console.log(
    'Discover: Park Cleanup Day, Warehouse Sorting, After-School Tutoring, Community Garden Planting',
  );
  console.log(
    'Time entries: created across Community Support and Food Distribution',
  );
  console.log(
    [
      `Demo invites (${DEMO_USER_EMAIL}): 12 pending (9 one-time + Weekly Meal Prep x3) → home Invitations section (10 preview) + /invitations`,
      `  accepted → /shifts/${acceptedInvite.shiftId} (Accepted badge + Cancel)`,
      `  declined → /shifts/${declinedInvite.shiftId} (VOLUNTEER_REJECTED)`,
      `  cancelled → /shifts/${cancelledInvite.shiftId} (CANCELLED, post-withdrawal)`,
      `  joined → /shifts/${selfJoinedShift.shiftId} (JOINED)`,
    ].join('\n'),
  );

  // No admin UI to toggle accountingEnabled yet — this script never runs in production.
  const enabledOrgs = await db
    .update(schema.organizations)
    .set({ accountingEnabled: true })
    .returning({ id: schema.organizations.id });
  console.log(`Accounting enabled on ${enabledOrgs.length} organization(s).`);

  // Backfill missing unit postal fields so accounting documents have an org
  // address/city/zip to render (a document with "—" in the footer is a hard
  // dead-end the org can't fix without an edit form). The document renders the
  // UNIT's profile, so patch the org's root unit. Only fills gaps.
  for (const enabledOrg of enabledOrgs) {
    const rootUnit = await db.query.organizationUnits.findFirst({
      where: { organizationId: enabledOrg.id, parentId: { isNull: true } },
    });
    if (!rootUnit) continue;
    const patch: Partial<typeof schema.organizationUnits.$inferInsert> = {};
    if (!rootUnit.address) patch.address = 'Hauptstraße 1';
    if (!rootUnit.city) patch.city = 'Berlin';
    if (!rootUnit.zipCode) patch.zipCode = '10115';
    if (!rootUnit.legalRep) patch.legalRep = 'Max Mustermann';
    if (Object.keys(patch).length > 0) {
      await db
        .update(schema.organizationUnits)
        .set(patch)
        .where(eq(schema.organizationUnits.id, rootUnit.id));
    }
  }

  // Give every accounting-enabled org default contract + invoice templates so
  // documents can be created out of the box on a fresh provision.
  for (const enabledOrg of enabledOrgs) {
    await ensureAccountingDocumentTemplates(db, enabledOrg.id);
  }
  console.log(
    `Seeded default accounting document templates on ${enabledOrgs.length} organization(s).`,
  );

  await pool.end();
}

seedFixtures().catch((error) => {
  console.error(error);
  process.exit(1);
});
